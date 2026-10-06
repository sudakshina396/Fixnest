const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./email');

exports.notifyUser = async (userId, title, message, bookingId) => {
  const notification = await Notification.create({ userId, title, message, bookingId });
  const user = await User.findById(userId).select('email name');
  if (user?.email) {
    // Keep booking updates available in-app even if SMTP is temporarily unavailable.
    sendNotificationEmail(user.email, user.name, title, message).catch((error) => console.error('Booking notification email failed:', error.message));
  }
  return notification;
};
