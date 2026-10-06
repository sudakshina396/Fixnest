const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Worker = require('../models/Worker');
const { notifyUser } = require('../utils/notifications');

exports.createBooking = async (req, res) => {
  try {
    const { serviceId, address, scheduledDate, scheduledTime, instructions } = req.body;
    
    // Get service to calculate price
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (service.isAvailable === false) return res.status(400).json({ success: false, message: 'This service is currently unavailable for booking.' });

    // Add service fee or use base price
    const price = service.basePrice + 49; // Fixed service fee from prompt example

    const booking = await Booking.create({
      userId: req.user._id,
      serviceId,
      address,
      scheduledDate,
      scheduledTime,
      price,
      instructions,
      status: 'PENDING'
    });

    await notifyUser(req.user._id, 'Booking received', `Your ${service.name} booking is pending confirmation for ${scheduledDate} at ${scheduledTime}.`, booking._id);

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Place every cart item as an individual booking with one shared checkout address and time.
exports.createCartBookings = async (req, res) => {
  try {
    const { items, address, scheduledDate, scheduledTime, instructions } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return res.status(400).json({ success: false, message: 'Your cart must contain between 1 and 20 services.' });
    }
    if (!address?.fullName || !address?.phone || !address?.house || !address?.street || !address?.city || !address?.state || !address?.pincode || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Complete the contact, address, date, and time details.' });
    }
    const serviceIds = [...new Set(items.map((item) => item?.serviceId).filter(Boolean))];
    if (serviceIds.length !== items.length) {
      return res.status(400).json({ success: false, message: 'Cart contains an invalid or repeated service.' });
    }
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ success: false, message: 'One or more services are no longer available. Refresh your cart.' });
    }
    const byId = new Map(services.map((service) => [String(service._id), service]));
    const bookings = await Booking.insertMany(items.map(({ serviceId }) => {
      const service = byId.get(String(serviceId));
      return {
        userId: req.user._id,
        serviceId: service._id,
        address,
        scheduledDate,
        scheduledTime,
        price: service.basePrice + 49,
        instructions,
        paymentMethod: 'CASH',
        status: 'PENDING',
      };
    }));
    await notifyUser(req.user._id, 'Orders received', `${bookings.length} service booking${bookings.length === 1 ? '' : 's'} placed for ${scheduledDate} at ${scheduledTime}.`, bookings[0]._id);
    res.status(201).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .populate('serviceId', 'name category city basePrice')
      .populate('workerId', 'name phone email')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load bookings.' });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    if (!scheduledDate || !scheduledTime || Number.isNaN(Date.parse(`${scheduledDate}T${scheduledTime}`)) || new Date(`${scheduledDate}T${scheduledTime}`) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Choose a future date and time.' });
    }
    const booking = await Booking.findById(req.params.id).populate('serviceId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (String(booking.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'You cannot update this booking.' });
    if (booking.workerId || !['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'You can reschedule before a professional is assigned.' });
    }
    booking.scheduledDate = scheduledDate;
    booking.scheduledTime = scheduledTime;
    await booking.save();
    await notifyUser(req.user._id, 'Booking rescheduled', `Your ${booking.serviceId?.name || 'service'} is now scheduled for ${scheduledDate} at ${scheduledTime}.`, booking._id);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addBookingReview = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1000) {
      return res.status(400).json({ success: false, message: 'Choose a 1–5 star rating and keep the review under 1000 characters.' });
    }
    const booking = await Booking.findById(req.params.id).populate('serviceId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (String(booking.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'You cannot review this booking.' });
    if (booking.status !== 'COMPLETED') return res.status(400).json({ success: false, message: 'Reviews are available after service completion.' });
    if (booking.review?.rating) return res.status(409).json({ success: false, message: 'This booking already has a review.' });
    booking.review = { rating, comment, createdAt: new Date() };
    await booking.save();
    res.status(201).json({ success: true, data: booking.review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('serviceId', 'name image category')
      .populate('workerId', 'name phone rating')
      .sort('-createdAt');
      
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;
    
    // Verify worker exists and is approved
    const worker = await Worker.findById(workerId);
    if (!worker || worker.verificationStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Invalid or unapproved worker' });
    }

    const booking = await Booking.findById(req.params.id).populate('serviceId', 'name');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.workerId = workerId;
    booking.status = 'ASSIGNED';
    await booking.save();
    await notifyUser(booking.userId, 'Professional assigned', `${worker.name} has been assigned to your ${booking.serviceId?.name || 'service'} booking.`, booking._id);

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'WORKER_ACCEPTED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && String(booking.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You cannot update this booking.' });
    }
    if (req.user.role !== 'admin') {
      if (status !== 'CANCELLED') return res.status(403).json({ success: false, message: 'Customers can only cancel their bookings here.' });
      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: 'This booking can no longer be cancelled. Contact support for help.' });
      }
      booking.status = status;
      await booking.save();
    } else {
      booking.status = status;
      await booking.save();
    }

    const service = await booking.populate('serviceId', 'name');
    const statusMessage = status === 'CANCELLED' ? `Your ${service.serviceId?.name || 'service'} booking was cancelled.` : `Your ${service.serviceId?.name || 'service'} booking status is now ${status.replaceAll('_', ' ').toLowerCase()}.`;
    await notifyUser(booking.userId, status === 'CANCELLED' ? 'Booking cancelled' : 'Booking update', statusMessage, booking._id);

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
