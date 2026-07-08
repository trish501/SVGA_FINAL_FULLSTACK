const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/audit-logs?search=&module=&action=&result=&page=&limit=
router.get('/audit-logs', async (req, res) => {
  try {
    const { search, module, action, result, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (result) filter.result = result;

    if (search) {
      filter.$or = [
        { adminName: { $regex: String(search), $options: 'i' } },
        { action: { $regex: String(search), $options: 'i' } },
        { module: { $regex: String(search), $options: 'i' } },
        { details: { $regex: String(search), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch audit logs' });
  }
});

router.get('/audit-logs/export', async (req, res) => {
  try {
    const { search, module, action, result } = req.query;
    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (result) filter.result = result;

    if (search) {
      filter.$or = [
        { adminName: { $regex: String(search), $options: 'i' } },
        { action: { $regex: String(search), $options: 'i' } },
        { module: { $regex: String(search), $options: 'i' } },
        { details: { $regex: String(search), $options: 'i' } },
      ];
    }

    const items = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(500);
    const header = ['timestamp', 'admin', 'action', 'module', 'result', 'details'];
    const rows = items.map(item => [
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.adminName || '',
      item.action || '',
      item.module || '',
      item.result || '',
      (item.details || '').replace(/\r?\n/g, ' '),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.type('text/csv').send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export audit logs' });
  }
});

module.exports = router;

