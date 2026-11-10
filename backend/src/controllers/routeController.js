const Route = require('../models/Route');
const AuditLog = require('../models/AuditLog');

// Create route
exports.createRoute = async (req, res, next) => {
  try {
    const { origin, destination, distanceKm, estimatedDurationMinutes, boardingPoints, droppingPoints } = req.body;

    const route = await Route.create({
      origin,
      destination,
      distanceKm,
      estimatedDurationMinutes,
      boardingPoints: boardingPoints || [
        { name: `${origin} Main Bus Terminal`, landmark: 'Platform 1', timeOffsetMinutes: 0 }
      ],
      droppingPoints: droppingPoints || [
        { name: `${destination} Central Hub`, landmark: 'City Center', timeOffsetMinutes: estimatedDurationMinutes || 360 }
      ]
    });

    await AuditLog.create({
      action: 'ROUTE_CREATED',
      entityType: 'Route',
      entityId: route._id,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      details: { origin, destination, distanceKm },
      ipAddress: req.ip || ''
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    next(error);
  }
};

// Get all routes
exports.getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ origin: 1, destination: 1 });
    res.status(200).json({
      success: true,
      count: routes.length,
      routes
    });
  } catch (error) {
    next(error);
  }
};

// Get unified list of available cities (standard + created routes)
exports.getCities = async (req, res, next) => {
  try {
    const standardCities = [
      'Bangalore',
      'Hyderabad',
      'Chennai',
      'Mumbai',
      'Pune',
      'Goa',
      'Delhi',
      'Jaipur',
      'Ahmedabad',
      'Surat',
      'Kolkata',
      'Kochi',
      'Coimbatore',
      'Mysore',
      'Tirupati',
      'Vijayawada',
      'Visakhapatnam',
      'Madurai',
      'Mangalore',
      'Indore',
      'Bhopal',
      'Nagpur',
      'Lucknow',
      'Varanasi',
      'Agra',
      'Chandigarh',
      'Dehradun'
    ];

    const routes = await Route.find({ isActive: true }).select('origin destination');
    const citySet = new Set(standardCities);

    routes.forEach((r) => {
      if (r.origin) citySet.add(r.origin.trim());
      if (r.destination) citySet.add(r.destination.trim());
    });

    const sortedCities = Array.from(citySet).sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      cities: sortedCities
    });
  } catch (error) {
    next(error);
  }
};

// Get single route by ID
exports.getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.status(200).json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

