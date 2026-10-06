const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  phone: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ['customer', 'worker', 'admin'],
    default: 'customer',
  },
  profileImage: {
    type: String,
    default: '',
  },
  addresses: [{
    label: { type: String, default: 'Home' },
    fullName: String,
    phone: String,
    house: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    instructions: String
  }],
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
