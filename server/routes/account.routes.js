const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const { getAddresses, addAddress, deleteAddress, getNotifications, markNotificationRead } = require('../controllers/account.controller');

router.use(authenticateUser);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
