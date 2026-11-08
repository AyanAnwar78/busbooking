const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const { calculateRefund } = require('./refundService');

/**
 * Generate a unique PNR reference
 * Example: PNR-20261108-AB12
 */
const generatePNR = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PNR-${dateStr}-${randomPart}`;
};

/**
 * Atomically book seats on a trip to prevent race conditions and double bookings.
 */
const createBooking = async ({
  tripId,
  user,
  passengerDetails,
  seatNumbers,
  boardingPoint,
  droppingPoint,
  contactPhone,
  contactEmail,
  ipAddress = ''
}) => {
  if (!seatNumbers || seatNumbers.length === 0) {
    const error = new Error('At least one seat must be selected.');
    error.statusCode = 400;
    throw error;
  }

  // Find trip first to validate pricing and details
  const trip = await Trip.findById(tripId).populate('route bus operator');
  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  if (trip.status !== 'SCHEDULED') {
    const error = new Error(`Cannot book seats. Trip is currently ${trip.status}.`);
    error.statusCode = 400;
    throw error;
  }

  // Validate that all requested seat numbers exist in this trip's layout
  const tripSeatMap = new Map(trip.seats.map((s) => [s.seatNumber, s]));
  for (const seatNo of seatNumbers) {
    const seatObj = tripSeatMap.get(seatNo);
    if (!seatObj) {
      const error = new Error(`Seat ${seatNo} does not exist on this bus.`);
      error.statusCode = 400;
      throw error;
    }
    if (seatObj.status !== 'AVAILABLE') {
      const error = new Error(`Seat ${seatNo} is already booked.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Calculate total amount based on individual seat fares
  let totalAmount = 0;
  for (const seatNo of seatNumbers) {
    const seatObj = tripSeatMap.get(seatNo);
    totalAmount += seatObj.fare || trip.baseFare;
  }

  const pnr = generatePNR();
  const bookingObjectId = new mongoose.Types.ObjectId();

  try {
    // ATOMIC SEAT RESERVATION QUERY
    // This query atomically matches the Trip ONLY IF ALL requested seats are status: 'AVAILABLE'
    const seatElemMatches = seatNumbers.map((sNo) => ({
      $elemMatch: { seatNumber: sNo, status: 'AVAILABLE' }
    }));

    const updateQuery = {
      $set: {},
      $inc: { availableSeatCount: -seatNumbers.length }
    };

    // Use arrayFilters to update the specific seats
    const arrayFilters = [];
    seatNumbers.forEach((sNo, index) => {
      const filterKey = `s${index}`;
      updateQuery.$set[`seats.$[${filterKey}].status`] = 'BOOKED';
      updateQuery.$set[`seats.$[${filterKey}].bookingId`] = bookingObjectId;
      arrayFilters.push({ [`${filterKey}.seatNumber`]: sNo, [`${filterKey}.status`]: 'AVAILABLE' });
    });

    const updatedTrip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        status: 'SCHEDULED',
        seats: { $all: seatElemMatches }
      },
      updateQuery,
      {
        new: true,
        arrayFilters,
        runValidators: true
      }
    );

    // If updatedTrip is null, another concurrent request grabbed one of the seats first!
    if (!updatedTrip) {
      const conflictError = new Error(
        'Concurrency conflict: One or more of the selected seats were just booked by another user. Please choose another seat.'
      );
      conflictError.statusCode = 409;
      throw conflictError;
    }

    // Create the Booking document
    const resolvedBoardingPoint = {
      name: boardingPoint?.name || 'Origin Station',
      time: boardingPoint?.time || trip.departureTime || new Date(),
      landmark: boardingPoint?.landmark || ''
    };

    const resolvedDroppingPoint = {
      name: droppingPoint?.name || 'Destination Station',
      time: droppingPoint?.time || trip.arrivalTime || new Date(),
      landmark: droppingPoint?.landmark || ''
    };

    const newBookingData = {
      _id: bookingObjectId,
      pnr,
      trip: tripId,
      user: user._id,
      passengerDetails,
      seatNumbers,
      boardingPoint: resolvedBoardingPoint,
      droppingPoint: resolvedDroppingPoint,
      totalAmount,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      contactPhone,
      contactEmail
    };

    const newBooking = await Booking.create(newBookingData);

    // Create Audit Log
    await AuditLog.create({
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: newBooking._id,
      performedBy: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      details: {
        pnr,
        tripId,
        seatNumbers,
        totalAmount
      },
      ipAddress
    });

    // Return populated booking
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate({
        path: 'trip',
        populate: [
          { path: 'route' },
          { path: 'bus' },
          { path: 'operator' }
        ]
      })
      .populate('user', 'name email phone');

    return populatedBooking;
  } catch (error) {
    // Manual rollback in case atomic update succeeded but booking creation failed
    if (error.statusCode !== 409) {
      await Trip.updateOne(
        { _id: tripId },
        {
          $set: {
            'seats.$[elem].status': 'AVAILABLE',
            'seats.$[elem].bookingId': null
          },
          $inc: { availableSeatCount: seatNumbers.length }
        },
        {
          arrayFilters: [{ 'elem.bookingId': bookingObjectId }]
        }
      ).catch(() => {});
    }

    throw error;
  }
};

/**
 * Cancel a booking, recalculate refund according to trip rules, and free up seats.
 */
const cancelBooking = async ({ bookingId, user, reason = 'Customer requested cancellation', ipAddress = '' }) => {
  const booking = await Booking.findById(bookingId).populate('trip');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: only owner of booking, operator of trip, or admin can cancel
  if (
    user.role === 'customer' &&
    booking.user.toString() !== user._id.toString()
  ) {
    const error = new Error('You are not authorized to cancel this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'CANCELLED') {
    const error = new Error('Booking is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  const trip = await Trip.findById(booking.trip._id);
  if (!trip) {
    const error = new Error('Associated trip not found');
    error.statusCode = 404;
    throw error;
  }

  // Compute refund according to cancellation rules
  const refundResult = calculateRefund(trip, booking.totalAmount, new Date());

  // Atomic update to free the seats in Trip
  const seatNumbers = booking.seatNumbers;
  await Trip.updateOne(
    { _id: trip._id },
    {
      $set: {
        'seats.$[elem].status': 'AVAILABLE',
        'seats.$[elem].bookingId': null
      },
      $inc: { availableSeatCount: seatNumbers.length }
    },
    {
      arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }]
    }
  );

  // Update Booking status and refund details
  booking.status = 'CANCELLED';
  booking.paymentStatus = refundResult.refundAmount > 0 ? 'PARTIALLY_REFUNDED' : 'PAID';
  booking.cancellationDetails = {
    cancelledAt: new Date(),
    refundAmount: refundResult.refundAmount,
    refundPercentage: refundResult.refundPercentage,
    cancellationFee: refundResult.cancellationFee,
    refundStatus: 'PROCESSED',
    reason
  };

  await booking.save();

  // Audit log
  await AuditLog.create({
    action: 'BOOKING_CANCELLED',
    entityType: 'Booking',
    entityId: booking._id,
    performedBy: {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    details: {
      pnr: booking.pnr,
      freedSeats: seatNumbers,
      refundDetails: booking.cancellationDetails
    },
    ipAddress
  });

  return booking;
};

module.exports = {
  generatePNR,
  createBooking,
  cancelBooking
};

