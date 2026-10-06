const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  address: {
    fullName: String,
    phone: String,
    house: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    instructions: String
  },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'WORKER_ACCEPTED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: { type: String, enum: ['CASH'], default: 'CASH' },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    createdAt: Date,
  },
  instructions: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
