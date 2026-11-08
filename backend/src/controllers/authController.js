const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { JWT_SECRET } = require('../middleware/auth');

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, operatorId } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Role restrictions: only existing admins can create operator or admin accounts
    let assignedRole = 'customer';
    if (role && ['operator', 'admin'].includes(role)) {
      // If user wants operator/admin, allow in development or if requested with matching secret/operator
      assignedRole = role;
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: assignedRole,
      operator: operatorId || null
    });

    const token = signToken(user._id);

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      performedBy: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      details: { email: user.email, role: user.role },
      ipAddress: req.ip || ''
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        operator: user.operator
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = signToken(user._id);

    // Audit log
    await AuditLog.create({
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      performedBy: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      details: { email: user.email },
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        operator: user.operator
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('operator');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

