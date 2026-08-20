const { auth, db, Timestamp } = require('../firebase-admin');

// ── Generate a join code from a name prefix ───────────────────────────────
function generateJoinCode(prefix) {
  const p = (prefix || 'BZ').replace(/\s+/g, '').substring(0, 2).toUpperCase();
  const s = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${p}-${s}`;
}

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user doc from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Forbidden: User not registered. Please register first.' });
    }

    const userData = userDoc.data();

    // ── Auto-migrate old users that don't have businessId yet ─────────────
    // These are users who registered before the multi-tenancy update.
    // We auto-create a personal business for them so they can keep using the app.
    if (!userData.businessId) {
      console.log(`[Auto-migrate] Creating business for legacy user: ${uid}`);
      const businessRef = db.collection('businesses').doc();
      const businessId  = businessRef.id;
      const joinCode    = generateJoinCode(userData.name || 'MY');
      const now         = Timestamp.now();

      await db.batch()
        .set(businessRef, {
          businessName: `${userData.name || 'My'}'s Business`,
          ownerId:  uid,
          joinCode,
          createdAt: now,
          autoMigrated: true
        })
        .update(db.collection('users').doc(uid), { businessId, role: userData.role || 'Admin' })
        .commit();

      userData.businessId = businessId;
      console.log(`[Auto-migrate] ✅ businessId=${businessId}, joinCode=${joinCode}`);
    }

    req.user = {
      uid,
      email:      userData.email      || decodedToken.email || '',
      role:       userData.role       || 'Manager',
      name:       userData.name       || '',
      businessId: userData.businessId
    };

    next();
  } catch (error) {
    console.error('Verify Token Error:', error.message);
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

module.exports = verifyToken;
