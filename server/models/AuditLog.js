const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    adminName: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    result: {
      type: String,
      enum: ['Success', 'Failed', 'Warning'],
      default: 'Success',
    },
    details: { type: String, default: '' },
    // optional metadata for debugging / UI
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminName: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

