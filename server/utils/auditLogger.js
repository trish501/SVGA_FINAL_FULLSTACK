const AuditLog = require('../models/AuditLog');
const { resolveAdminName, resolveAdminUserId } = require('./adminContext');

async function writeAuditLog(req, { action, module, result = 'Success', details = '', meta = {} }) {
  try {
    const adminName = await resolveAdminName(req);
    await AuditLog.create({
      adminUserId: resolveAdminUserId(req),
      adminName,
      action,
      module,
      result,
      details,
      meta,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}

module.exports = { writeAuditLog };
