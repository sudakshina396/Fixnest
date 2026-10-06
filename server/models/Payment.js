const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Card', 'Cash'], required: true },
  transactionId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
