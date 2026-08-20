const express = require('express');
const router  = express.Router();
const { db, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');

const bizCol = (businessId, col) =>
  db.collection('businesses').doc(businessId).collection(col);

// GET /dead-stock — items with stock > 0 and no sale in 90+ days
router.get('/dead-stock', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const cutoff = Timestamp.fromMillis(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // NOTE: This query requires a Firestore composite index on (currentStock, lastSaleAt).
    // If it fails, Firebase will log a link in the console — click it to create the index.
    let snapshot;
    try {
      snapshot = await bizCol(businessId, 'inventory')
        .where('currentStock', '>', 0)
        .where('lastSaleAt', '<=', cutoff)
        .orderBy('currentStock')
        .orderBy('lastSaleAt', 'asc')
        .get();
    } catch (indexErr) {
      // Fallback: fetch all and filter client-side if index not created yet
      console.warn('Composite index missing — falling back to client-side filter:', indexErr.message);
      snapshot = await bizCol(businessId, 'inventory').get();
    }

    const deadStock = [];
    let totalCapitalLocked = 0;

    snapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      const lastSaleMs = item.lastSaleAt?._seconds
        ? item.lastSaleAt._seconds * 1000
        : Date.now();
      const daysInactive = Math.floor((Date.now() - lastSaleMs) / (1000 * 60 * 60 * 24));

      if (item.currentStock > 0 && daysInactive > 90) {
        const capitalLocked = item.currentStock * (item.costPrice || 0);
        deadStock.push({ ...item, daysInactive, capitalLocked });
        totalCapitalLocked += capitalLocked;
      }
    });

    deadStock.sort((a, b) => b.daysInactive - a.daysInactive);

    res.json({ deadStock, totalCapitalLocked, totalItems: deadStock.length });
  } catch (error) { next(error); }
});

// GET /low-stock — items where currentStock <= reorderLevel
router.get('/low-stock', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const snapshot = await bizCol(businessId, 'inventory').get();
    const lowStock = [];
    snapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      if (item.currentStock > 0 && item.currentStock <= item.reorderLevel) {
        lowStock.push(item);
      }
    });
    res.json({ lowStock, totalItems: lowStock.length });
  } catch (error) { next(error); }
});

// GET /summary — dashboard stat cards
router.get('/summary', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const snapshot = await bizCol(businessId, 'inventory').get();
    const cutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000;

    let totalProducts = 0, totalInventoryValue = 0,
        capitalLockedInDeadStock = 0, lowStockCount = 0;

    snapshot.forEach(doc => {
      const item = doc.data();
      if (item.currentStock <= 0) return;
      totalProducts++;
      totalInventoryValue += item.currentStock * (item.unitPrice || 0);

      const lastSaleMs = item.lastSaleAt?._seconds
        ? item.lastSaleAt._seconds * 1000 : Date.now();
      const daysInactive = Math.floor((Date.now() - lastSaleMs) / (1000 * 60 * 60 * 24));

      if (daysInactive > 90) capitalLockedInDeadStock += item.currentStock * (item.costPrice || 0);
      if (item.currentStock <= item.reorderLevel) lowStockCount++;
    });

    res.json({ totalProducts, totalInventoryValue, capitalLockedInDeadStock, lowStockCount });
  } catch (error) { next(error); }
});

// GET /sales-trend — last 6 months sales grouped by month
router.get('/sales-trend', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const sixMonthsAgo = Timestamp.fromMillis(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const snapshot = await bizCol(businessId, 'sales')
      .where('transactionDate', '>=', sixMonthsAgo)
      .get();

    const monthMap = {};
    snapshot.forEach(doc => {
      const sale = doc.data();
      const date = sale.transactionDate?._seconds
        ? new Date(sale.transactionDate._seconds * 1000)
        : new Date();
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { total: 0, qty: 0 };
      monthMap[key].total += sale.totalAmount  || 0;
      monthMap[key].qty   += sale.quantitySold || 0;
    });

    const months     = Object.keys(monthMap);
    const totals     = months.map(m => Math.round(monthMap[m].total));
    const quantities = months.map(m => monthMap[m].qty);

    res.json({ months, totals, quantities });
  } catch (error) { next(error); }
});

// GET /by-category — inventory value grouped by category
router.get('/by-category', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const snapshot = await bizCol(businessId, 'inventory').get();
    const catMap = {};

    snapshot.forEach(doc => {
      const item = doc.data();
      const cat  = item.categoryName || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += (item.currentStock || 0) * (item.unitPrice || 0);
    });

    const categories = Object.keys(catMap);
    const values     = categories.map(c => Math.round(catMap[c]));

    res.json({ categories, values });
  } catch (error) { next(error); }
});

module.exports = router;
