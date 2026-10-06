const Otp = require('../models/Otp');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/email');

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

const issueOtp = async (email, flow, context = {}) => {
  const existingOtp = await Otp.findOne({ email });
  if (existingOtp) {
    const timeDiff = Date.now() - new Date(existingOtp.lastSentAt).getTime();
    if (timeDiff < 60000) {
      return { status: 429, body: { success: false, message: 'Please wait 60 seconds before requesting a new OTP.' } };
    }
    await Otp.deleteOne({ email });
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  await Otp.create({
    email,
    otpHash,
    flow,
    ...context,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  const emailSent = await sendOtpEmail(email, otp);
  if (!emailSent) {
    await Otp.deleteOne({ email });
    return { status: 503, body: { success: false, message: 'Email delivery is unavailable. Please try again later.' } };
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Password verified. Enter the email verification code to continue.',
      delivery: emailSent,
    },
  };
};

exports.signupSendOtp = async (req, res) => {
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

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await issueOtp(email, 'signup', { passwordHash, name, phone });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Signup OTP request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not start signup. Please try again.' });
  }
};

exports.loginSendOtp = async (req, res) => {
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
    if (!user) return res.status(404).json({ success: false, message: 'Account not available. Please sign up first.' });

    let flow = 'login';
    let passwordHash;
    if (user.passwordHash) {
      if (!await bcrypt.compare(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    } else {
      // Existing OTP-only accounts must set a password; the email OTP verifies ownership.
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Set a password with at least 8 characters to continue.' });
      }
      flow = 'set-password';
      passwordHash = await bcrypt.hash(password, 12);
    }

    const result = await issueOtp(email, flow, passwordHash ? { passwordHash } : {});
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Login OTP request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not start sign-in. Please try again.' });
  }
};

exports.forgotPasswordSendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ success: false, message: 'Enter your email address.' });

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    const user = await User.findOne({ email }).select('+passwordHash');
    if (email !== adminEmail && !user) {
      return res.status(404).json({ success: false, message: 'Account not available. Please sign up first.' });
    }
    if (email === adminEmail || user?.role !== 'admin') {
      const result = await issueOtp(email, 'password-reset');
      if (result.status !== 200) return res.status(result.status).json(result.body);
      return res.status(200).json({ success: true, message: 'A verification code has been sent to your email.', delivery: result.body.delivery });
    }
    return res.status(404).json({ success: false, message: 'Account not available. Please use the correct sign-in option.' });
  } catch (error) {
    console.error('Password reset OTP request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not start password reset. Please try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : String(req.body.otp || '');
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the email and 6-digit verification code.' });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || !otpRecord.flow) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Request a new code.' });
    }
    if (otpRecord.expiresAt <= new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new code.' });
    }
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ success: false, message: 'Maximum verification attempts exceeded. Request a new code.' });
    }
    if (!await bcrypt.compare(otp, otpRecord.otpHash)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    if (otpRecord.flow === 'password-reset') {
      const newPassword = req.body.newPassword;
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      }
      const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
      if (email === adminEmail) {
        let admin = await User.findOne({ email }).select('+passwordHash');
        if (!admin) admin = new User({ email, role: 'admin' });
        admin.role = 'admin';
        admin.passwordHash = await bcrypt.hash(newPassword, 12);
        await admin.save();
      } else {
        const customer = await User.findOne({ email }).select('+passwordHash');
        if (!customer || customer.role === 'admin') {
          await Otp.deleteOne({ _id: otpRecord._id });
          return res.status(400).json({ success: false, message: 'Password reset could not be completed. Request a new code.' });
        }
        customer.passwordHash = await bcrypt.hash(newPassword, 12);
        await customer.save();
      }
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(200).json({ success: true, message: 'Password updated. You can now sign in with your new password.' });
    }

    let user;
    if (otpRecord.flow === 'signup') {
      if (await User.exists({ email })) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(409).json({ success: false, message: 'An account already exists. Log in instead.' });
      }
      user = await User.create({
        email,
        name: otpRecord.name,
        phone: otpRecord.phone,
        passwordHash: otpRecord.passwordHash,
      });
    } else if (otpRecord.flow === 'admin-login') {
      const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
      if (!adminEmail || email !== adminEmail) {
        return res.status(401).json({ success: false, message: 'Admin verification could not be completed.' });
      }
      user = await User.findOne({ email });
      if (!user) user = await User.create({ email, role: 'admin' });
      else if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    } else {
      user = await User.findOne({ email }).select('+passwordHash');
      if (!user || user.role === 'admin') {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(401).json({ success: false, message: 'This account cannot complete customer sign-in.' });
      }
      if (otpRecord.flow === 'set-password') {
        user.passwordHash = otpRecord.passwordHash;
        await user.save();
      } else if (otpRecord.flow !== 'login' || !user.passwordHash) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(401).json({ success: false, message: 'Sign-in verification is no longer valid. Start again.' });
      }
    }

    await Otp.deleteOne({ _id: otpRecord._id });
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('OTP verification failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
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

    const admin = await User.findOne({ email: adminEmail, role: 'admin' }).select('+passwordHash');
    // Deployment configuration is the source of truth for the configured admin account.
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || admin?.passwordHash;
    if (!passwordHash) return res.status(503).json({ success: false, message: 'Admin sign-in is not configured.' });

    const validPassword = await bcrypt.compare(typeof password === 'string' ? password : '', passwordHash);
    if (email !== adminEmail || !validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const result = await issueOtp(adminEmail, 'admin-login');
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Admin sign-in failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not start admin sign-in. Please try again.' });
  }
};
