const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

const createSession = (user) => ({
  success: true,
  token: jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  user: { id: user._id, email: user.email, name: user.name || user.email, role: user.role },
});

exports.signup = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    const password = req.body.password;

    if (!email || !name || !phone || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    if (email === normalizeEmail(process.env.ADMIN_EMAIL)) {
      return res.status(409).json({ success: false, message: 'Use the Admin login option for this email.' });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ success: false, message: 'An account already exists. Log in instead.' });
    }

    const user = await User.create({
      email,
      name,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'customer',
    });
    return res.status(201).json(createSession(user));
  } catch (error) {
    console.error('Signup failed:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account already exists. Log in instead.' });
    }
    return res.status(500).json({ success: false, message: 'Could not create the account. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    if (email === normalizeEmail(process.env.ADMIN_EMAIL)) {
      return res.status(403).json({ success: false, message: 'Use the Admin login option for this email.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not available. Please sign up first.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Use the Admin login option for this email.' });
    }
    if (!user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account is disabled. Contact support.' });
    }

    return res.status(200).json(createSession(user));
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not sign in. Please try again.' });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    if (!adminEmail) {
      return res.status(503).json({ success: false, message: 'Admin sign-in is not configured.' });
    }

    let admin = await User.findOne({ email: adminEmail }).select('+passwordHash');
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || admin?.passwordHash;
    if (!passwordHash) {
      return res.status(503).json({ success: false, message: 'Admin sign-in is not configured.' });
    }
    const validPassword = typeof password === 'string' && await bcrypt.compare(password, passwordHash);
    if (email !== adminEmail || !validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!admin) admin = new User({ email: adminEmail });
    admin.role = 'admin';
    if (process.env.ADMIN_PASSWORD_HASH) admin.passwordHash = process.env.ADMIN_PASSWORD_HASH;
    await admin.save();
    return res.status(200).json(createSession(admin));
  } catch (error) {
    console.error('Admin sign-in failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not sign in. Please try again.' });
  }
};
