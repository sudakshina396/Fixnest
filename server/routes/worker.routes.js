const express = require('express');
const router = express.Router();
const {
  signupWorker,
  getWorkers,
  updateVerificationStatus
} = require('../controllers/worker.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Public route for worker signup
router.post('/signup', signupWorker);

// Protected routes
router.get('/', authenticateUser, getWorkers);
router.put('/:id/verify', authenticateUser, authorizeRoles('admin'), updateVerificationStatus);

module.exports = router;
