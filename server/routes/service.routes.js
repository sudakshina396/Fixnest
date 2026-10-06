const express = require('express');
const router = express.Router();
const {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
} = require('../controllers/service.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.route('/')
  .get(getAllServices)
  .post(authenticateUser, authorizeRoles('admin'), createService);

router.route('/:id')
  .get(getServiceById)
  .put(authenticateUser, authorizeRoles('admin'), updateService)
  .delete(authenticateUser, authorizeRoles('admin'), deleteService);

module.exports = router;
