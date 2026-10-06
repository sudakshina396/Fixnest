const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.json({ success: true, data: user?.addresses || [] });
};

exports.addAddress = async (req, res) => {
  try {
    const fields = ['fullName', 'phone', 'house', 'street', 'city', 'state', 'pincode'];
    const address = Object.fromEntries(fields.map((field) => [field, String(req.body[field] || '').trim()]));
    if (fields.some((field) => !address[field])) return res.status(400).json({ success: false, message: 'Complete all required address fields.' });
    if (!/^\d{10}$/.test(address.phone)) return res.status(400).json({ success: false, message: 'Phone number must contain 10 digits.' });
    address.instructions = String(req.body.instructions || '').trim().slice(0, 500);
    address.label = String(req.body.label || 'Home').trim().slice(0, 30) || 'Home';
    const user = await User.findByIdAndUpdate(req.user._id, { $push: { addresses: address } }, { new: true, runValidators: true }).select('addresses');
    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteAddress = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: { _id: req.params.addressId } } }, { new: true }).select('addresses');
  res.json({ success: true, data: user?.addresses || [] });
};

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort('-createdAt').limit(30);
  res.json({ success: true, data: notifications });
};

exports.markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, data: notification });
};
