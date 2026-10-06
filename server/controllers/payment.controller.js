const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const generateTransactionId = () => {
  return 'FXN_TXN_' + Math.floor(100000 + Math.random() * 900000).toString();
};

exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;
    
    // In a real app, you would initiate Stripe/Razorpay here
    
    const payment = await Payment.create({
      bookingId,
      userId: req.user._id,
      amount,
      method,
      transactionId: generateTransactionId(),
      status: 'PENDING'
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.simulatePayment = async (req, res) => {
  try {
    const { paymentId, success } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (success) {
      payment.status = 'SUCCESS';
      await payment.save();

      // Update Booking
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'SUCCESS',
        status: 'CONFIRMED'
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Payment Successful',
        transactionId: payment.transactionId,
        data: payment 
      });
    } else {
      payment.status = 'FAILED';
      await payment.save();
      
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'FAILED'
      });

      return res.status(400).json({ 
        success: false, 
        message: 'Payment Failed. Please try again.',
        data: payment 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
