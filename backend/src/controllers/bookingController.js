const bookingService = require('../services/bookingService');
const Booking = require('../models/Booking');

// Create Booking
exports.createBooking = async (req, res, next) => {
  try {
    const {
      tripId,
      passengerDetails,
      seatNumbers,
      boardingPoint,
      droppingPoint,
      contactPhone,
      contactEmail
    } = req.body;

    const booking = await bookingService.createBooking({
      tripId,
      user: req.user,
      passengerDetails,
      seatNumbers,
      boardingPoint,
      droppingPoint,
      contactPhone,
      contactEmail,
      ipAddress: req.ip || ''
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelledBooking = await bookingService.cancelBooking({
      bookingId: id,
      user: req.user,
      reason,
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refund processed according to cancellation rules.',
      booking: cancelledBooking
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'trip',
        populate: [{ path: 'route' }, { path: 'bus' }, { path: 'operator' }]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by PNR or ID
exports.getBookingByPNR = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const query = identifier.startsWith('PNR-')
      ? { pnr: identifier.toUpperCase() }
      : { _id: identifier };

    const booking = await Booking.findOne(query)
      .populate({
        path: 'trip',
        populate: [{ path: 'route' }, { path: 'bus' }, { path: 'operator' }]
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No ticket found with this reference/PNR.'
      });
    }

    // Role check: customer can only view their own ticket
    if (
      req.user.role === 'customer' &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket.'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings (Operator / Admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { pnr: { $regex: search, $options: 'i' } },
        { contactPhone: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate({
          path: 'trip',
          populate: [{ path: 'route' }, { path: 'bus' }, { path: 'operator' }]
        })
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      bookings
    });
  } catch (error) {
    next(error);
  }
};

