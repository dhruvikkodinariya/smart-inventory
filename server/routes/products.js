const express = require('express');
const router  = express.Router();
const { db, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');

router.use(verifyToken);

// Helper — business-scoped collection references
const bizCol = (businessId, col) =>
  db.collection('businesses').doc(businessId).collection(col);

// GET / — fetch all inventory for this business
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const { businessId } = req.user;

    let query = bizCol(businessId, 'inventory');
    if (category) query = query.where('categoryName', '==', category);

    const snapshot = await query.get();
    let items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(i => (i.productName || '').toLowerCase().includes(s));
    }

    res.json(items);
  } catch (error) { next(error); }
});

// POST / — add product (creates both /products and /inventory docs)
router.post('/', checkRole(['Admin', 'Manager']), async (req, res, next) => {
  try {
    const { name, categoryId, categoryName, unitPrice, costPrice,
            reorderLevel, batchNumber, initialStock, expiryDate } = req.body;
    const { businessId } = req.user;

    const newId      = db.collection('businesses').doc().id;
    const now        = Timestamp.now();
    const expDate    = expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null;

    const productData = {
      name,
      categoryId:   categoryId || 'general',
      categoryName,
      unitPrice:    Number(unitPrice),
      costPrice:    Number(costPrice),
      reorderLevel: Number(reorderLevel),
      createdAt:    now,
      updatedAt:    now,
      status:       'active'
    };

    const inventoryData = {
      productId:    newId,
      productName:  name,
      categoryId:   categoryId || 'general',
      categoryName,
      batchNumber:  batchNumber || 'BATCH-1',
      currentStock: Number(initialStock) || 0,
      dateAdded:    now,
      expiryDate:   expDate,
      lastSaleAt:   now,
      unitPrice:    Number(unitPrice),
      costPrice:    Number(costPrice),
      reorderLevel: Number(reorderLevel)
    };

    const batch = db.batch();
    batch.set(bizCol(businessId, 'products').doc(newId),   productData);
    batch.set(bizCol(businessId, 'inventory').doc(newId),  inventoryData);
    await batch.commit();

    res.json({ message: 'Product added', productId: newId });
  } catch (error) { next(error); }
});

// PUT /:id — update product
router.put('/:id', checkRole(['Admin', 'Manager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, categoryName, unitPrice, costPrice, reorderLevel } = req.body;
    const { businessId } = req.user;
    const now = Timestamp.now();

    const productUpdate   = { updatedAt: now };
    const inventoryUpdate = {};

    if (name)                    { productUpdate.name = name;                          inventoryUpdate.productName  = name; }
    if (categoryName)            { productUpdate.categoryName = categoryName;          inventoryUpdate.categoryName = categoryName; }
    if (unitPrice !== undefined)  { productUpdate.unitPrice    = Number(unitPrice);    inventoryUpdate.unitPrice    = Number(unitPrice); }
    if (costPrice !== undefined)  { productUpdate.costPrice    = Number(costPrice);    inventoryUpdate.costPrice    = Number(costPrice); }
    if (reorderLevel !== undefined){ productUpdate.reorderLevel = Number(reorderLevel); inventoryUpdate.reorderLevel = Number(reorderLevel); }

    const batch = db.batch();
    batch.update(bizCol(businessId, 'products').doc(id),   productUpdate);
    batch.update(bizCol(businessId, 'inventory').doc(id),  inventoryUpdate);
    await batch.commit();

    res.json({ message: 'Product updated' });
  } catch (error) { next(error); }
});

// DELETE /:id — delete product (Admin only)
router.delete('/:id', checkRole(['Admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { businessId } = req.user;

    const batch = db.batch();
    batch.delete(bizCol(businessId, 'products').doc(id));
    batch.delete(bizCol(businessId, 'inventory').doc(id));
    await batch.commit();

    res.json({ message: 'Product deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
