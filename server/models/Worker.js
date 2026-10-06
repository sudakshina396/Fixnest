const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  profileImage: { type: String },
  skills: [{ type: String }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  experience: { type: String },
  serviceAreas: [{ type: String }],
  rating: { type: Number, default: 0 },
  totalJobs: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  }
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
