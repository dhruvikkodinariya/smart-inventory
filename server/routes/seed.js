const express = require('express');
const router  = express.Router();
const { db, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');

const categoriesList = ['Electronics', 'Clothing', 'Food & Beverage', 'Stationery', 'Hardware'];

const bizCol = (businessId, col) =>
  db.collection('businesses').doc(businessId).collection(col);

const generateSeedData = () => {
  const products = [
    // Electronics (12)
    { name: 'USB Cable',         cat: 'Electronics',     cp:   50, up:  150 },
    { name: 'Wireless Mouse',    cat: 'Electronics',     cp:  300, up:  600 },
    { name: 'Keyboard',          cat: 'Electronics',     cp:  400, up:  800 },
    { name: 'Power Bank',        cat: 'Electronics',     cp:  800, up: 1500 },
    { name: 'LED Bulb',          cat: 'Electronics',     cp:   80, up:  120 },
    { name: 'HDMI Cable',        cat: 'Electronics',     cp:  150, up:  350 },
    { name: 'Earphones',         cat: 'Electronics',     cp:  200, up:  500 },
    { name: 'Phone Stand',       cat: 'Electronics',     cp:   60, up:  150 },
    { name: 'Webcam',            cat: 'Electronics',     cp: 1200, up: 2500 },
    { name: 'Laptop Fan',        cat: 'Electronics',     cp:  450, up:  900 },
    { name: 'Screen Protector',  cat: 'Electronics',     cp:   40, up:  200 },
    { name: 'USB Hub',           cat: 'Electronics',     cp:  250, up:  500 },
    // Clothing (10)
    { name: 'Cotton T-Shirt',    cat: 'Clothing',        cp:  150, up:  400 },
    { name: 'Denim Jeans',       cat: 'Clothing',        cp:  600, up: 1200 },
    { name: 'Formal Shirt',      cat: 'Clothing',        cp:  450, up:  900 },
    { name: 'Track Pants',       cat: 'Clothing',        cp:  350, up:  700 },
    { name: 'Hoodie',            cat: 'Clothing',        cp:  700, up: 1500 },
    { name: 'Socks (Pack)',      cat: 'Clothing',        cp:   80, up:  200 },
    { name: 'Cap',               cat: 'Clothing',        cp:  100, up:  250 },
    { name: 'Kurta',             cat: 'Clothing',        cp:  400, up:  850 },
    { name: 'Saree',             cat: 'Clothing',        cp:  800, up: 2000 },
    { name: 'Belt',              cat: 'Clothing',        cp:  150, up:  350 },
    // Food & Beverage (10)
    { name: 'Basmati Rice 5kg',  cat: 'Food & Beverage', cp:  400, up:  550 },
    { name: 'Wheat Flour 10kg',  cat: 'Food & Beverage', cp:  350, up:  420 },
    { name: 'Refined Oil 5L',    cat: 'Food & Beverage', cp:  600, up:  750 },
    { name: 'Toor Dal 2kg',      cat: 'Food & Beverage', cp:  220, up:  280 },
    { name: 'Sugar 5kg',         cat: 'Food & Beverage', cp:  180, up:  220 },
    { name: 'Salt 1kg',          cat: 'Food & Beverage', cp:   15, up:   25 },
    { name: 'Tea 500g',          cat: 'Food & Beverage', cp:  200, up:  260 },
    { name: 'Coffee 200g',       cat: 'Food & Beverage', cp:  250, up:  350 },
    { name: 'Biscuits (Pack)',   cat: 'Food & Beverage', cp:   40, up:   60 },
    { name: 'Instant Noodles',   cat: 'Food & Beverage', cp:   45, up:   60 },
    // Stationery (10)
    { name: 'Ballpoint Pens',    cat: 'Stationery',      cp:   30, up:   60 },
    { name: 'Notebook A4',       cat: 'Stationery',      cp:   40, up:   80 },
    { name: 'Stapler',           cat: 'Stationery',      cp:   80, up:  150 },
    { name: 'Scissors',          cat: 'Stationery',      cp:   50, up:  100 },
    { name: 'Marker Set',        cat: 'Stationery',      cp:   90, up:  150 },
    { name: 'Glue Stick',        cat: 'Stationery',      cp:   20, up:   40 },
    { name: 'Ruler',             cat: 'Stationery',      cp:   10, up:   20 },
    { name: 'Eraser Pack',       cat: 'Stationery',      cp:   15, up:   30 },
    { name: 'File Folder',       cat: 'Stationery',      cp:   25, up:   50 },
    { name: 'Tape Roll',         cat: 'Stationery',      cp:   15, up:   35 },
    // Hardware (10)
    { name: 'Hammer',            cat: 'Hardware',        cp:  120, up:  250 },
    { name: 'Screwdriver Set',   cat: 'Hardware',        cp:  200, up:  400 },
    { name: 'Electric Drill',    cat: 'Hardware',        cp: 1500, up: 2800 },
    { name: 'Measuring Tape',    cat: 'Hardware',        cp:   80, up:  150 },
    { name: 'Paint Brush Set',   cat: 'Hardware',        cp:  100, up:  220 },
    { name: 'Nails (Box)',       cat: 'Hardware',        cp:   50, up:  120 },
    { name: 'Wrench Set',        cat: 'Hardware',        cp:  400, up:  750 },
    { name: 'Sandpaper Roll',    cat: 'Hardware',        cp:   60, up:  130 },
    { name: 'PVC Pipe',          cat: 'Hardware',        cp:  150, up:  300 },
    { name: 'Wire Reel',         cat: 'Hardware',        cp:  350, up:  600 },
  ];

  const now = Date.now();
  const deadCutoff = now - (130 * 24 * 60 * 60 * 1000);
  const reorderLevel = 15;

  return products.map((p, index) => {
    let stock = Math.floor(Math.random() * 50) + 20;
    let lastSaleAtMillis = now - (Math.random() * 10 * 24 * 60 * 60 * 1000);

    if (index < 15) {
      // Dead stock items
      lastSaleAtMillis = deadCutoff - (Math.random() * 20 * 24 * 60 * 60 * 1000);
      stock = Math.floor(Math.random() * 40) + 20;
    } else if (index >= 15 && index < 23) {
      // Low stock items
      stock = Math.floor(Math.random() * reorderLevel) + 1;
    }

    return {
      name: p.name,
      categoryName: p.cat,
      categoryId: p.cat.toLowerCase().replace(/\s+/g, '-').replace('&', 'and'),
      costPrice: p.cp,
      unitPrice: p.up,
      reorderLevel,
      initialStock: stock,
      lastSaleAtMillis
    };
  });
};

// POST / — seed demo data for this business
router.post('/', verifyToken, checkRole(['Admin']), async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const seedData = generateSeedData();
    let batchWriter = db.batch();
    let opCount = 0;
    const nowTimestamp = Timestamp.now();
    let productsCreated = 0;

    // Seed categories
    categoriesList.forEach(cat => {
      const id     = cat.toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
      const catRef = bizCol(businessId, 'categories').doc(id);
      batchWriter.set(catRef, { name: cat, createdAt: nowTimestamp });
      opCount++;
    });

    for (const item of seedData) {
      if (opCount >= 490) {
        await batchWriter.commit();
        batchWriter = db.batch();
        opCount = 0;
      }

      const newId       = db.collection('businesses').doc().id;
      const productRef  = bizCol(businessId, 'products').doc(newId);
      const inventoryRef = bizCol(businessId, 'inventory').doc(newId);

      batchWriter.set(productRef, {
        name:         item.name,
        categoryId:   item.categoryId,
        categoryName: item.categoryName,
        unitPrice:    item.unitPrice,
        costPrice:    item.costPrice,
        reorderLevel: item.reorderLevel,
        createdAt:    nowTimestamp,
        updatedAt:    nowTimestamp,
        status:       'active'
      });

      batchWriter.set(inventoryRef, {
        productId:    newId,
        productName:  item.name,
        categoryId:   item.categoryId,
        categoryName: item.categoryName,
        batchNumber:  'SEED-BATCH-1',
        currentStock: item.initialStock,
        dateAdded:    nowTimestamp,
        expiryDate:   null,
        lastSaleAt:   Timestamp.fromMillis(item.lastSaleAtMillis),
        unitPrice:    item.unitPrice,
        costPrice:    item.costPrice,
        reorderLevel: item.reorderLevel
      });

      opCount += 2;
      productsCreated++;
    }

    if (opCount > 0) await batchWriter.commit();

    res.json({ message: 'Demo data seeded successfully', productsCreated });
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
