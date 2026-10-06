const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  flow: {
    type: String,
    enum: ['signup', 'login', 'set-password', 'admin-login', 'password-reset'],
    required: true,
  },
  passwordHash: { type: String },
  name: { type: String, trim: true },
  phone: { type: String },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index based on this field
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
