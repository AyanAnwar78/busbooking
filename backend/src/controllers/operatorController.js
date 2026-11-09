const Operator = require('../models/Operator');
const AuditLog = require('../models/AuditLog');

// Get all operators
exports.getOperators = async (req, res, next) => {
  try {
    const operators = await Operator.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: operators.length,
      operators
    });
  } catch (error) {
    next(error);
  }
};

// Get operator by ID
exports.getOperatorById = async (req, res, next) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }
    res.status(200).json({ success: true, operator });
  } catch (error) {
    next(error);
  }
};

// Create operator (Admin only)
exports.createOperator = async (req, res, next) => {
  try {
    const { name, contactEmail, contactPhone, licenseNumber, rating } = req.body;

    const operator = await Operator.create({
      name,
      contactEmail,
      contactPhone,
      licenseNumber: licenseNumber || '',
      rating: Number(rating) || 4.5
    });

    await AuditLog.create({
      action: 'USER_REGISTERED',
      entityType: 'Operator',
      entityId: operator._id,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      details: { name, contactEmail, licenseNumber },
      ipAddress: req.ip || ''
    });

    res.status(201).json({
      success: true,
      message: 'Operator created successfully',
      operator
    });
  } catch (error) {
    next(error);
  }
};

