const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

// All booking actions require authentication
router.use(authenticate);

router.post('/', bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/ticket/:identifier', bookingController.getBookingByPNR);
router.patch('/:id/cancel', bookingController.cancelBooking);

// Operator & Admin route
router.get('/all', authorize('operator', 'admin'), bookingController.getAllBookings);

module.exports = router;

