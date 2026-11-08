const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticate, authorize } = require('../middleware/auth');

// Public endpoints
router.get('/search', tripController.searchTrips);
router.get('/:id', tripController.getTripById);

// Protected endpoints (Operator & Admin)
router.get('/', authenticate, authorize('operator', 'admin'), tripController.getAllTrips);
router.post('/', authenticate, authorize('operator', 'admin'), tripController.createTrip);
router.patch('/:id/status', authenticate, authorize('operator', 'admin'), tripController.updateTripStatus);

module.exports = router;

