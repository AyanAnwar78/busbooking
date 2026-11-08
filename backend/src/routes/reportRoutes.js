const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('operator', 'admin'));

// Acceptance Test #5: Passenger Manifest & Occupancy Summaries
router.get('/manifest/:tripId', reportController.getPassengerManifest);
router.get('/occupancy', reportController.getOccupancySummary);
router.get('/dashboard', reportController.getDashboardStats);

module.exports = router;

