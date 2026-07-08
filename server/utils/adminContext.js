const AdminSettings = require('../models/AdminSettings');

async function resolveAdminName(req) {
  const settings = await AdminSettings.findOne({ key: 'default' }).select('adminProfile.displayName').lean();
  const displayName = settings?.adminProfile?.displayName?.trim();
  if (displayName) return displayName;
  return req.user?.name || req.user?.username || 'Admin';
}

function resolveAdminUserId(req) {
  const userId = req.user?.userId;
  if (!userId || userId === 'admin') return null;
  return userId;
}

module.exports = { resolveAdminName, resolveAdminUserId };
