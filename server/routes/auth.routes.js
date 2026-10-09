const express = require('express');
const router = express.Router();
const { signup, login, adminLogin } = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many account creation attempts. Try again in 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin sign-in attempts. Try again in 15 minutes.' },
});

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/admin-login', adminLoginLimiter, adminLogin);

module.exports = router;
