const express = require('express');
const router = express.Router();
const {
  createBooking,
  createCartBookings,
  getMyBookings,
  getAllBookings,
  rescheduleBooking,
  addBookingReview,
  assignWorker,
  updateBookingStatus
} = require('../controllers/booking.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser); // All booking routes require auth

router.route('/')
  .post(createBooking)
  .get(getMyBookings);

router.post('/cart-checkout', createCartBookings);
router.get('/admin/all', authorizeRoles('admin'), getAllBookings);
router.put('/:id/reschedule', rescheduleBooking);
router.post('/:id/review', addBookingReview);

router.put('/:id/assign', authorizeRoles('admin'), assignWorker);
router.put('/:id/status', updateBookingStatus); // In a real app, restrict based on role and current status

module.exports = router;
