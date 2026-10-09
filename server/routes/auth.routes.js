const express = require('express');
const router = express.Router();
const { signupSendOtp, login, forgotPasswordSendOtp, verifyOtp, adminLogin } = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting for OTP requests: max 3 requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  message: { success: false, message: 'You’ve requested several verification codes recently. Please try again in 15 minutes.' }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin sign-in attempts. Try again in 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

router.post('/signup/send-otp', otpLimiter, signupSendOtp);
router.post('/login', loginLimiter, login);
// Keep password-protected aliases during the frontend deployment transition.
router.post('/login/send-otp', loginLimiter, login);
router.post('/forgot-password/send-otp', otpLimiter, forgotPasswordSendOtp);
// Keep the former path password-protected so older clients cannot sign in with email alone.
router.post('/send-otp', loginLimiter, login);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLoginLimiter, adminLogin);

module.exports = router;
