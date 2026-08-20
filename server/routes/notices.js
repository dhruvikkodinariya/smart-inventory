const express = require('express');
const router = express.Router();
const { db, Timestamp } = require('../firebase-admin');
const verifyToken = require('../middleware/verifyToken');

// ── GET /api/notices — Get all active notices for the business ────────────
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { businessId } = req.user;
    const now = Date.now();

    // NOTE: We do NOT use .orderBy() here to avoid requiring a composite
    // Firestore index on (businessId + createdAt). We sort in memory instead.
    const snap = await db.collection('notices')
      .where('businessId', '==', businessId)
      .limit(50)
      .get();

    const notices = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      // Filter out expired notices
      .filter(n => !n.expiresAt || (n.expiresAt.toMillis ? n.expiresAt.toMillis() : n.expiresAt) > now)
      // Sort: pinned first, then newest first
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

    return res.json({ notices });
  } catch (error) {
    console.error('[notices GET error]', error.message);
    next(error);
  }
});

// ── POST /api/notices — Post a new notice (Admin/Manager only) ────────────
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { role, businessId, uid, name } = req.user;
    if (role !== 'Admin' && role !== 'Manager') {
      return res.status(403).json({ error: 'Only Admin or Manager can post notices.' });
    }

    const { title, body, pinned = false, expiryDays } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    const now = Timestamp.now();
    let expiresAt = null;
    if (expiryDays && parseInt(expiryDays) > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + parseInt(expiryDays));
      expiresAt = Timestamp.fromDate(expDate);
    }

    const noticeData = {
      businessId,
      title: title.trim(),
      body: body.trim(),
      pinned: Boolean(pinned),
      postedBy: name || 'Admin',
      postedByRole: role,
      postedById: uid,
      createdAt: now,
      expiresAt,
    };

    const docRef = await db.collection('notices').add(noticeData);

    return res.json({
      message: 'Notice posted successfully',
      notice: { id: docRef.id, ...noticeData }
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/notices/:id — Delete a notice (Admin/Manager only) ────────
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, businessId } = req.user;
    if (role !== 'Admin' && role !== 'Manager') {
      return res.status(403).json({ error: 'Only Admin or Manager can delete notices.' });
    }

    const noticeDoc = await db.collection('notices').doc(req.params.id).get();
    if (!noticeDoc.exists) return res.status(404).json({ error: 'Notice not found.' });
    if (noticeDoc.data().businessId !== businessId) return res.status(403).json({ error: 'Forbidden.' });

    await db.collection('notices').doc(req.params.id).delete();
    return res.json({ message: 'Notice deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
