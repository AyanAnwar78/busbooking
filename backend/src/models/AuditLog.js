const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'USER_REGISTERED',
        'USER_LOGIN',
        'TRIP_CREATED',
        'TRIP_STATUS_UPDATED',
        'BOOKING_CREATED',
        'BOOKING_CANCELLED',
        'REFUND_PROCESSED',
        'BUS_CREATED',
        'ROUTE_CREATED'
      ]
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Booking', 'Trip', 'User', 'Bus', 'Route', 'Operator']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      name: { type: String, default: 'System' },
      email: { type: String, default: 'system@busbooking.local' },
      role: { type: String, default: 'system' }
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

