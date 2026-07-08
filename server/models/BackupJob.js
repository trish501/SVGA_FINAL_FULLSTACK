const mongoose = require('mongoose');

const backupJobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['scheduled', 'running', 'completed', 'failed'],
      default: 'scheduled',
    },
    type: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic',
    },
    sizeBytes: { type: Number, default: 0 },
    filePath: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

backupJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BackupJob', backupJobSchema);
