const AuditLog = require('../models/AuditLog');

// Get audit logs (Admin / Operator)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error) {
    next(error);
  }
};

