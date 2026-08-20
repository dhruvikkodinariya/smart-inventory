const express = require('express');
const router = express.Router();
const { auth, db, Timestamp } = require('../firebase-admin');
const { sendOtpEmail } = require('../emailService');

// ── Helper: Generate a short unique Join Code ─────────────────────────────
function generateJoinCode(businessName) {
  const prefix = businessName.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

// ── Helper: Generate 6-digit OTP ──────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /send-otp — Send OTP to email ────────────────────────────────────
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in Firestore (keyed by email)
    await db.collection('otpStore').doc(email).set({
      otp,
      expiresAt,
      email,
      createdAt: Timestamp.now(),
    });

    // Send OTP email (real or Ethereal test)
    const result = await sendOtpEmail(email, otp, name || 'User');

    return res.json({
      message: 'OTP sent successfully. Check your email.',
      // In test mode, return the Ethereal preview URL so client can show it
      previewUrl: result.previewUrl || null,
      testMode: !!result.previewUrl,
    });
  } catch (error) {
    console.error('[send-otp error]', error.message);
    next(error);
  }
});

// ── POST /verify-otp — Verify OTP ─────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const otpDoc = await db.collection('otpStore').doc(email).get();
    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new OTP.' });
    }

    const { otp: storedOtp, expiresAt } = otpDoc.data();

    if (Date.now() > expiresAt) {
      await db.collection('otpStore').doc(email).delete();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (otp.trim() !== storedOtp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Mark as verified
    await db.collection('otpStore').doc(email).set({ verified: true }, { merge: true });

    return res.json({ message: 'Email verified successfully!', verified: true });
  } catch (error) {
    next(error);
  }
});

// ── POST /register ────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { idToken, name, email, role, adminCode, businessName, joinCode } = req.body;
    if (!idToken || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ── OTP Verification Check ─────────────────────────────────────────────
    const otpDoc = await db.collection('otpStore').doc(email).get();
    if (!otpDoc.exists || !otpDoc.data().verified) {
      return res.status(403).json({ error: 'Email not verified. Please complete OTP verification first.' });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ── ADMIN: Creates a new business ─────────────────────────────────────
    if (role === 'Admin') {
      const secretCode = process.env.ADMIN_SECRET_CODE;
      if (!adminCode || adminCode !== secretCode) {
        return res.status(403).json({ error: 'Invalid Admin code. Contact your system administrator.' });
      }
      if (!businessName || !businessName.trim()) {
        return res.status(400).json({ error: 'Business name is required for Admin registration.' });
      }

      const businessRef = db.collection('businesses').doc();
      const businessId  = businessRef.id;
      const code        = generateJoinCode(businessName.trim());
      const now         = Timestamp.now();

      const businessData = {
        businessName: businessName.trim(),
        ownerId:  uid,
        joinCode: code,
        createdAt: now
      };

      const userData = {
        uid,
        name,
        email,
        role: 'Admin',
        businessId,
        createdAt: now
      };

      const batch = db.batch();
      batch.set(businessRef, businessData);
      batch.set(db.collection('users').doc(uid), userData);
      await batch.commit();

      // Clean up OTP record
      await db.collection('otpStore').doc(email).delete().catch(() => {});

      return res.json({
        message: 'Business created & Admin registered',
        user: userData,
        businessId,
        businessName: businessName.trim(),
        joinCode: code   // ← Admin shares this with their Managers/Staff
      });
    }

    // ── MANAGER or STAFF: Joins existing business using Join Code ─────────
    if (role === 'Manager' || role === 'Staff') {
      if (!joinCode || !joinCode.trim()) {
        return res.status(400).json({ error: 'Business Join Code is required to join a business.' });
      }

      // Find business by joinCode
      const bizSnap = await db.collection('businesses')
        .where('joinCode', '==', joinCode.trim().toUpperCase())
        .limit(1)
        .get();

      if (bizSnap.empty) {
        return res.status(404).json({ error: 'Invalid Join Code. Ask your Admin for the correct code.' });
      }

      const bizDoc     = bizSnap.docs[0];
      const businessId = bizDoc.id;
      const businessData = bizDoc.data();
      const now = Timestamp.now();

      const userData = {
        uid,
        name,
        email,
        role,
        businessId,
        createdAt: now
      };

      await db.collection('users').doc(uid).set(userData, { merge: true });

      // Clean up OTP record
      await db.collection('otpStore').doc(email).delete().catch(() => {});

      return res.json({
        message: `${role} registered & joined business`,
        user: userData,
        businessId,
        businessName: businessData.businessName
      });
    }

    return res.status(400).json({ error: 'Role must be Admin, Manager, or Staff.' });

  } catch (error) {
    next(error);
  }
});

// ── POST /login ───────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const userData   = userDoc.data();
    const businessId = userData.businessId;

    // Fetch business info
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const bizData = bizDoc.exists ? bizDoc.data() : {};

    return res.json({
      message: 'Login successful',
      user: userData,
      businessId,
      businessName: bizData.businessName || '',
      joinCode: userData.role === 'Admin' ? bizData.joinCode : undefined
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
