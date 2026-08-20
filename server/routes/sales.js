const express = require('express');
const router  = express.Router();
const { db, FieldValue, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');

const bizCol = (businessId, col) =>
  db.collection('businesses').doc(businessId).collection(col);

// POST / — log a sale (atomic Firestore transaction)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { productId, quantitySold } = req.body;
    const { businessId, uid, name: soldByName } = req.user;

    if (!productId || !quantitySold || quantitySold <= 0) {
      return res.status(400).json({ error: 'Invalid productId or quantitySold' });
    }

    const inventoryRef = bizCol(businessId, 'inventory').doc(productId);
    const saleRef      = bizCol(businessId, 'sales').doc();

    let newStock, transactionId;

    await db.runTransaction(async (t) => {
      const invDoc = await t.get(inventoryRef);
      if (!invDoc.exists) throw new Error('Product not found in inventory');

      const inv = invDoc.data();
      if (inv.currentStock < quantitySold) {
        throw new Error(`Insufficient stock. Available: ${inv.currentStock}`);
      }

      newStock      = inv.currentStock - quantitySold;
      transactionId = saleRef.id;
      const now     = Timestamp.now();

      // Decrement stock + update lastSaleAt
      t.update(inventoryRef, {
        currentStock: newStock,
        lastSaleAt:   now
      });

      // Create sale record
      t.set(saleRef, {
        productId,
        productName:   inv.productName,
        categoryName:  inv.categoryName,
        quantitySold:  Number(quantitySold),
        unitPrice:     inv.unitPrice,
        totalAmount:   Number(quantitySold) * inv.unitPrice,
        transactionDate: now,
        soldBy:        uid,
        soldByName:    soldByName || ''
      });
    });

    res.json({ message: 'Sale logged', newStock, transactionId });
  } catch (error) {
    next(error);
  }
});

// GET / — last 100 sales for this business
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const snapshot = await bizCol(businessId, 'sales')
      .orderBy('transactionDate', 'desc')
      .limit(100)
      .get();
    const sales = [];
    snapshot.forEach(doc => sales.push({ id: doc.id, ...doc.data() }));
    res.json(sales);
  } catch (error) { next(error); }
});

module.exports = router;
