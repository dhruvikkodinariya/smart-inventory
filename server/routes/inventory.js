const express = require('express');
const router  = express.Router();
const { db, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');

const bizCol = (businessId, col) =>
  db.collection('businesses').doc(businessId).collection(col);

// GET / — list all inventory for this business
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const snapshot = await bizCol(businessId, 'inventory').orderBy('productName').get();
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) { next(error); }
});

// PUT /:id — update stock / reorder level
router.put('/:id', verifyToken, checkRole(['Admin', 'Manager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentStock, reorderLevel } = req.body;
    const { businessId } = req.user;
    const now = Timestamp.now();

    const update = { updatedAt: now };
    if (currentStock !== undefined) update.currentStock  = Number(currentStock);
    if (reorderLevel !== undefined) update.reorderLevel  = Number(reorderLevel);

    await bizCol(businessId, 'inventory').doc(id).update(update);
    if (reorderLevel !== undefined) {
      await bizCol(businessId, 'products').doc(id).update({ reorderLevel: Number(reorderLevel), updatedAt: now });
    }

    res.json({ message: 'Inventory updated' });
  } catch (error) { next(error); }
});

module.exports = router;
