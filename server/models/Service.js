const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  city: { type: String, required: true, trim: true, lowercase: true },
  image: {
    type: String,
    maxlength: 1500000,
    match: /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i,
  },
  basePrice: { type: Number, required: true },
  duration: { type: String, required: true },
  includedItems: [{ type: String }],
  excludedItems: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
