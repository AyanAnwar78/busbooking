const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Operator = require('../models/Operator');
const AuditLog = require('../models/AuditLog');

// Search trips by origin, destination, and travel date
exports.searchTrips = async (req, res, next) => {
  try {
    const { origin, destination, date, busType, operatorId, sortBy, order = 'asc' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required to search trips.'
      });
    }

    // Find routes matching origin and destination (case-insensitive regex)
    const matchingRoutes = await Route.find({
      origin: { $regex: new RegExp(`^${origin.trim()}$`, 'i') },
      destination: { $regex: new RegExp(`^${destination.trim()}$`, 'i') },
      isActive: true
    }).select('_id');

    if (!matchingRoutes || matchingRoutes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        trips: []
      });
    }

    const routeIds = matchingRoutes.map((r) => r._id);

    const tripFilter = {
      route: { $in: routeIds },
      status: { $in: ['SCHEDULED', 'BOARDING'] }
    };

    // Date filtering (if specified)
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      tripFilter.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    if (operatorId) {
      tripFilter.operator = operatorId;
    }

    let query = Trip.find(tripFilter)
      .populate('route')
      .populate('bus')
      .populate('operator');

    // Sorting
    if (sortBy === 'fare') {
      query = query.sort({ baseFare: order === 'desc' ? -1 : 1 });
    } else if (sortBy === 'departure') {
      query = query.sort({ departureTime: order === 'desc' ? -1 : 1 });
    } else {
      query = query.sort({ departureTime: 1 });
    }

    let trips = await query;

    // Filter by bus type if requested
    if (busType) {
      trips = trips.filter((t) => t.bus && t.bus.busType === busType);
    }

    // Add computed duration in hours & minutes for easy UI display
    const formattedTrips = trips.map((trip) => {
      const departure = new Date(trip.departureTime);
      const arrival = new Date(trip.arrivalTime);
      const durationMs = arrival - departure;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        ...trip.toObject(),
        durationFormatted: `${hours}h ${minutes}m`,
        availableSeats: trip.availableSeatCount
      };
    });

    res.status(200).json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips
    });
  } catch (error) {
    next(error);
  }
};

// Get single trip by ID (including seat layout with current booking statuses)
exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('route')
      .populate('bus')
      .populate('operator');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    next(error);
  }
};

// Create a new Trip (Operator / Admin)
exports.createTrip = async (req, res, next) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, baseFare, cancellationRules } = req.body;

    const bus = await Bus.findById(busId).populate('operator');
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Build seats array from bus seat layout
    const tripSeats = bus.seats.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      tier: s.tier,
      type: s.type,
      fare: Math.round(baseFare * (s.basePriceMultiplier || 1.0)),
      status: 'AVAILABLE',
      bookingId: null
    }));

    const tripCode = `TRIP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const tripData = {
      tripCode,
      bus: bus._id,
      operator: bus.operator._id,
      route: route._id,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      baseFare: Number(baseFare),
      totalSeats: bus.totalSeats,
      availableSeatCount: bus.totalSeats,
      seats: tripSeats
    };

    if (cancellationRules && Array.isArray(cancellationRules)) {
      tripData.cancellationPolicy = { rules: cancellationRules };
    }

    const trip = await Trip.create(tripData);

    // Audit Log
    await AuditLog.create({
      action: 'TRIP_CREATED',
      entityType: 'Trip',
      entityId: trip._id,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      details: {
        tripCode: trip.tripCode,
        busId,
        routeId,
        departureTime,
        baseFare
      },
      ipAddress: req.ip || ''
    });

    const populated = await Trip.findById(trip._id)
      .populate('route')
      .populate('bus')
      .populate('operator');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip: populated
    });
  } catch (error) {
    next(error);
  }
};

// Update Trip Status (Operator / Admin)
exports.updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const oldStatus = trip.status;
    trip.status = status;
    await trip.save();

    await AuditLog.create({
      action: 'TRIP_STATUS_UPDATED',
      entityType: 'Trip',
      entityId: trip._id,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      details: { oldStatus, newStatus: status },
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: `Trip status updated to ${status}`,
      trip
    });
  } catch (error) {
    next(error);
  }
};

// Get all trips with pagination and filters (Operator / Admin)
exports.getAllTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, operatorId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (operatorId) filter.operator = operatorId;

    // If operator role, restrict to their operator id
    if (req.user.role === 'operator' && req.user.operator) {
      filter.operator = req.user.operator;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('route')
        .populate('bus')
        .populate('operator')
        .sort({ departureTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Trip.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      trips
    });
  } catch (error) {
    next(error);
  }
};

