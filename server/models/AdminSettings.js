const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    // store a single settings document (or multiple by scope/branch later)
    key: { type: String, default: 'default', index: true },

    // Administrative profile settings
    adminProfile: {
      displayName: { type: String, default: '' },
      email: { type: String, default: '' },
      profilePhotoUrl: { type: String, default: null },
    },

    // Permissions model could evolve; for now store role/flags
    permissions: {
      roles: [{ name: String, permissions: [String] }],
      defaultRole: { type: String, default: 'super_admin' },
    },

    // Templates for notifications/challan emails
    emailTemplates: {
      challan: { type: String, default: '' },
      requestApproved: { type: String, default: '' },
      requestRejected: { type: String, default: '' },
      inventoryLowStock: { type: String, default: '' },
    },

    // OTP configuration
    otp: {
      enabled: { type: Boolean, default: true },
      expiryMinutes: { type: Number, default: 5 },
      deliveryChannel: { type: String, default: 'sms' },
    },

    // Security configuration
    security: {
      twoFactorEnabled: { type: Boolean, default: true },
      sessionTtlMinutes: { type: Number, default: 60 * 24 },
    },

    // Backup configuration/state
    backup: {
      enabled: { type: Boolean, default: true },
      cron: { type: String, default: '0 2 * * *' }, // daily 2am
    },

    theme: {
      mode: { type: String, enum: ['light', 'dark'], default: 'light' },
      accentColor: { type: String, default: '#2563EB' },
    },

    system: {
      healthCheckLastRunAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

adminSettingsSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);

