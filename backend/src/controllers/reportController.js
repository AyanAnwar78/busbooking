const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Route = require('../models/Route');
const Operator = require('../models/Operator');

// Get Passenger Manifest for a Trip (Acceptance Test #5)
exports.getPassengerManifest = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('route')
      .populate('bus')
      .populate('operator');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Retrieve all CONFIRMED bookings for this trip
    const bookings = await Booking.find({
      trip: tripId,
      status: 'CONFIRMED'
    }).populate('user', 'name email phone');

    // Flatten to individual passenger records
    const passengers = [];
    bookings.forEach((booking) => {
      booking.passengerDetails.forEach((passenger) => {
        passengers.push({
          bookingId: booking._id,
          pnr: booking.pnr,
          seatNumber: passenger.seatNumber,
          passengerName: passenger.name,
          age: passenger.age,
          gender: passenger.gender,
          boardingPoint: booking.boardingPoint.name,
          boardingTime: booking.boardingPoint.time,
          droppingPoint: booking.droppingPoint.name,
          droppingTime: booking.droppingPoint.time,
          bookerName: booking.user ? booking.user.name : 'Guest',
          contactPhone: booking.contactPhone,
          contactEmail: booking.contactEmail,
          status: booking.status
        });
      });
    });

    // Sort passengers by seat number (natural numeric sort e.g. 1A, 2A, 10A)
    passengers.sort((a, b) =>
      a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true })
    );

    const totalSeats = trip.totalSeats;
    const bookedSeats = passengers.length;
    const availableSeats = trip.availableSeatCount;
    const occupancyPercentage = ((bookedSeats / totalSeats) * 100).toFixed(1);

    res.status(200).json({
      success: true,
      trip: {
        id: trip._id,
        tripCode: trip.tripCode,
        busNumber: trip.bus ? trip.bus.busNumber : '',
        busType: trip.bus ? trip.bus.busType : '',
        operatorName: trip.operator ? trip.operator.name : '',
        route: trip.route ? `${trip.route.origin} -> ${trip.route.destination}` : '',
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        totalSeats,
        bookedSeats,
        availableSeats,
        occupancyPercentage: Number(occupancyPercentage)
      },
      manifest: {
        totalConfirmedPassengers: passengers.length,
        passengers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Route & Trip Occupancy Summary (Acceptance Test #5)
exports.getOccupancySummary = async (req, res, next) => {
  try {
    const { operatorId, routeId } = req.query;
    const filter = { status: { $ne: 'CANCELLED' } };

    if (operatorId) filter.operator = operatorId;
    if (routeId) filter.route = routeId;

    if (req.user && req.user.role === 'operator' && req.user.operator) {
      filter.operator = req.user.operator;
    }

    const trips = await Trip.find(filter)
      .populate('route')
      .populate('bus')
      .populate('operator')
      .sort({ departureTime: -1 });

    const tripIds = trips.map((t) => t._id);

    // Reconcile with actual confirmed bookings
    const confirmedBookings = await Booking.find({
      trip: { $in: tripIds },
      status: 'CONFIRMED'
    });

    const bookingStatsByTrip = {};
    for (const b of confirmedBookings) {
      const tId = b.trip.toString();
      if (!bookingStatsByTrip[tId]) {
        bookingStatsByTrip[tId] = {
          bookedSeatsCount: 0,
          totalRevenue: 0,
          bookingsCount: 0
        };
      }
      bookingStatsByTrip[tId].bookedSeatsCount += b.seatNumbers.length;
      bookingStatsByTrip[tId].totalRevenue += b.totalAmount;
      bookingStatsByTrip[tId].bookingsCount += 1;
    }

    let globalTotalCapacity = 0;
    let globalBookedSeats = 0;
    let globalTotalRevenue = 0;

    const occupancyReports = trips.map((trip) => {
      const stats = bookingStatsByTrip[trip._id.toString()] || {
        bookedSeatsCount: 0,
        totalRevenue: 0,
        bookingsCount: 0
      };

      const occupancyRate = trip.totalSeats > 0
        ? Number(((stats.bookedSeatsCount / trip.totalSeats) * 100).toFixed(1))
        : 0;

      globalTotalCapacity += trip.totalSeats;
      globalBookedSeats += stats.bookedSeatsCount;
      globalTotalRevenue += stats.totalRevenue;

      return {
        tripId: trip._id,
        tripCode: trip.tripCode,
        operator: trip.operator ? trip.operator.name : 'N/A',
        route: trip.route ? `${trip.route.origin} to ${trip.route.destination}` : 'N/A',
        departureTime: trip.departureTime,
        totalSeats: trip.totalSeats,
        bookedSeats: stats.bookedSeatsCount,
        vacantSeats: trip.totalSeats - stats.bookedSeatsCount,
        occupancyRate,
        revenue: stats.totalRevenue,
        status: trip.status
      };
    });

    const overallOccupancyRate = globalTotalCapacity > 0
      ? Number(((globalBookedSeats / globalTotalCapacity) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalTrips: trips.length,
        totalCapacity: globalTotalCapacity,
        totalBookedSeats: globalBookedSeats,
        overallOccupancyRate,
        totalRevenue: globalTotalRevenue
      },
      reports: occupancyReports
    });
  } catch (error) {
    next(error);
  }
};

// Admin & Operator Dashboard High-Level Metrics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalTrips,
      activeTrips,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalOperators,
      revenueResult
    ] = await Promise.all([
      Trip.countDocuments(),
      Trip.countDocuments({ status: { $in: ['SCHEDULED', 'BOARDING'] } }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Operator.countDocuments({ isActive: true }),
      Booking.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Calculate recent 7-day bookings trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBookings = await Booking.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      stats: {
        totalTrips,
        activeTrips,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalOperators,
        totalRevenue,
        cancellationRate: totalBookings > 0
          ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1))
          : 0,
        recentBookingsCount: recentBookings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

