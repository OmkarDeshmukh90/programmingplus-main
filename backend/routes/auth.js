const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');

const router = express.Router();

// Nodemailer setup (explicit SMTP config for Gmail)
const smtpPort = Number(process.env.EMAIL_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: process.env.EMAIL_SECURE === 'true' || smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
});

// ================= Registration =================

// STEP 1: Send OTP
router.post('/register/send-otp', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const normalizedRole = role === "company" ? "company" : "candidate";

    await OtpVerification.findOneAndUpdate(
      { email },
      { email, password: hashedPassword, otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000), role: normalizedRole },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await transporter.sendMail({
      from: `"Programming+ Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Programming+ - Verify your account",
      html: `<p>Hello ${name},</p><p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });

    res.status(201).json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// STEP 2: Verify OTP & create user
router.post('/register/verify-otp', async (req, res) => {
  const { email, otp, name, role } = req.body;
  const normalizedOtp = String(otp || '').trim();
  const fail = (status, message) => {
    const error = new Error(message);
    error.status = status;
    throw error;
  };
  const isTxnUnsupported = (err) =>
    err?.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(err?.message || '');

  const createUserFromOtp = async (session) => {
    const otpRecord = await OtpVerification.findOneAndDelete(
      {
        email,
        otp: normalizedOtp,
        otpExpires: { $gt: new Date() },
      },
      session ? { session } : undefined
    );

    if (!otpRecord) {
      const existingRecord = await OtpVerification.findOne(
        { email },
        null,
        session ? { session } : undefined
      );
      if (!existingRecord) fail(404, 'No OTP request found');
      if (new Date() > new Date(existingRecord.otpExpires)) fail(400, 'OTP expired');
      fail(400, 'Invalid OTP');
    }

    const existingUser = await User.findOne(
      { email: otpRecord.email },
      null,
      session ? { session } : undefined
    );
    if (existingUser) fail(400, 'User already exists');

    const normalizedRole = role === "company" ? "company" : (otpRecord.role || "candidate");
    const createdUsers = await User.create(
      [{ name, email: otpRecord.email, password: otpRecord.password, isVerified: true, role: normalizedRole }],
      session ? { session } : undefined
    );
    return createdUsers[0];
  };

  let session;
  let newUser;
  try {
    session = await User.startSession();
    await session.withTransaction(async () => {
      newUser = await createUserFromOtp(session);
    });
  } catch (err) {
    if (isTxnUnsupported(err)) {
      try {
        newUser = await createUserFromOtp();
      } catch (fallbackErr) {
        console.error(fallbackErr);
        if (fallbackErr.code === 11000) {
          return res.status(400).json({ message: 'User already exists' });
        }
        return res
          .status(fallbackErr.status || 500)
          .json({ message: fallbackErr.message || 'Server error' });
      }
    } else {
      console.error(err);
      if (err.code === 11000) {
        return res.status(400).json({ message: 'User already exists' });
      }
      return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
  } finally {
    if (session) await session.endSession();
  }

  if (!newUser) {
    return res.status(500).json({ message: 'Server error' });
  }

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

  return res.json({
    success: true,
    message: 'Account created successfully!',
    token,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role || "candidate"
  });
});

// ================= Login =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    // Handle legacy/corrupt password data safely without exposing internals.
    if (typeof user.password !== 'string' || !user.password.startsWith('$2')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

    // ✅ Return token, name, and email
    res.json({
      token,
      name: user.name,
      email: user.email,
      role: user.role || "candidate"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Forgot Password =================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password - Programming+',
      text: `Your password reset OTP is ${otp}. It is valid for 10 minutes.`,
    });

    res.json({ message: 'Password reset OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp || user.otpExpires < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });

    res.json({ success: true, message: 'OTP verified, you can reset password now' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const { requireAuth } = require('@clerk/express');

// ================= Update Profile (name) =================
router.patch('/profile', requireAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found. Please complete onboarding first.' });

    user.name = name.trim();
    await user.save();

    return res.json({ success: true, name: user.name, message: 'Profile updated' });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Clerk Sync =================
router.post('/sync', requireAuth(), async (req, res) => {
  const { name, email, role } = req.body;
  const clerkId = req.auth.userId;

  try {
    let user = await User.findOne({ clerkId });
    
    if (user) {
      if (role && user.role !== role) {
        user.role = role;
        await user.save();
      }
      return res.json({ success: true, user, message: 'User updated' });
    }

    // fallback: user might exist by email from old auth
    user = await User.findOne({ email });
    if (user) {
      user.clerkId = clerkId;
      if (role && user.role !== role) {
        user.role = role;
      }
      await user.save();
      return res.json({ success: true, user, message: 'User linked to Clerk' });
    }

    // create new user
    user = new User({
      clerkId,
      name: name || 'User',
      email,
      role: role || 'candidate',
      password: 'clerk-user', // dummy password, since it's required in schema
      isVerified: true
    });
    
    await user.save();
    return res.status(201).json({ success: true, user, message: 'User created' });
  } catch (err) {
    console.error('[AUTH SYNC ERROR]', err);
    res.status(500).json({ message: 'Server error during sync' });
  }
});

module.exports = router;

