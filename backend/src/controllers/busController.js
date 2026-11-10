const Bus = require('../models/Bus');
const Operator = require('../models/Operator');
const AuditLog = require('../models/AuditLog');

// Generate default 2x2 seat layout
const generate2x2Layout = (totalSeats = 40) => {
  const seats = [];
  const rows = Math.ceil(totalSeats / 4);
  const cols = ['A', 'B', 'C', 'D'];

  let count = 0;
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < 4; c++) {
      if (count < totalSeats) {
        seats.push({
          seatNumber: `${r}${cols[c]}`,
          row: r,
          col: c + 1,
          tier: 'lower',
          type: 'seater',
          basePriceMultiplier: 1.0
        });
        count++;
      }
    }
  }
  return seats;
};

// Create a new bus
exports.createBus = async (req, res, next) => {
  try {
    const {
      busNumber,
      operatorId,
      busType,
      totalSeats = 40,
      layoutType = '2x2',
      amenities,
      customSeats
    } = req.body;

    // Resolve operator:
    // If the logged-in user is an operator, prioritize their company so the bus always appears in their fleet
    let assignedOperatorId = operatorId;
    if (req.user && req.user.role === 'operator' && req.user.operator) {
      assignedOperatorId = req.user.operator;
    }

    if (!assignedOperatorId) {
      const firstOp = await Operator.findOne();
      if (firstOp) {
        assignedOperatorId = firstOp._id;
        if (req.user && req.user.role === 'operator' && !req.user.operator) {
          const User = require('../models/User');
          await User.findByIdAndUpdate(req.user._id, { operator: firstOp._id });
        }
      }
    }

    const operator = await Operator.findById(assignedOperatorId);
    if (!operator) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    const seats = customSeats && customSeats.length > 0
      ? customSeats
      : generate2x2Layout(totalSeats);

    const bus = await Bus.create({
      busNumber: (busNumber || '').trim().toUpperCase(),
      operator: assignedOperatorId,
      busType,
      totalSeats: seats.length,
      layoutType,
      seats,
      amenities: amenities || ['WiFi', 'Charging Point', 'Water Bottle', 'Reading Light']
    });

    await AuditLog.create({
      action: 'BUS_CREATED',
      entityType: 'Bus',
      entityId: bus._id,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      details: { busNumber: bus.busNumber, busType, totalSeats: bus.totalSeats, operator: operator.name },
      ipAddress: req.ip || ''
    });

    const populatedBus = await Bus.findById(bus._id).populate('operator');

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      bus: populatedBus
    });
  } catch (error) {
    next(error);
  }
};

// Get all buses
exports.getBuses = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user && req.user.role === 'operator' && req.user.operator) {
      const myBusCount = await Bus.countDocuments({ isActive: true, operator: req.user.operator });
      if (myBusCount > 0) {
        filter.operator = req.user.operator;
      }
    }

    const buses = await Bus.find(filter).populate('operator').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    next(error);
  }
};

// Get single bus by ID
exports.getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('operator');
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.status(200).json({ success: true, bus });
  } catch (error) {
    next(error);
  }
};

