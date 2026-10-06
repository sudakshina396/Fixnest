const express = require('express');
const router = express.Router();
const {
  createPayment,
  simulatePayment,
  getPaymentById
} = require('../controllers/payment.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.post('/create', createPayment);
router.post('/simulate', simulatePayment);
router.get('/:id', getPaymentById);

module.exports = router;
