const Notification = require('../models/Notification');

const getStudentNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifs = await Notification.find({ studentId: userId, recipientType: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ success: true, notifications: notifs });
  } catch (err) {
    console.error('[Notifications] GetStudentNotifications error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const adminId = String(req.user.userId);
    const notifs = await Notification.find({
      recipientType: 'admin',
      $or: [{ adminId }, { adminId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ success: true, notifications: notifs });
  } catch (err) {
    console.error('[Notifications] GetAdminNotifications error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminUnreadCount = async (req, res) => {
  try {
    const adminId = String(req.user.userId);
    const count = await Notification.countDocuments({ recipientType: 'admin', isRead: false, $or: [{ adminId }, { adminId: null }] });
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error('[Notifications] GetAdminUnreadCount error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifId = req.params.id;
    const notif = await Notification.findOneAndUpdate({ _id: notifId, studentId: userId }, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] MarkRead error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markAdminNotificationRead = async (req, res) => {
  try {
    const adminId = String(req.user.userId);
    const notifId = req.params.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: notifId, recipientType: 'admin', $or: [{ adminId }, { adminId: null }] },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] MarkAdminNotificationRead error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminNotification = async (req, res) => {
  try {
    const { studentId, title, message, type, actionUrl, recipientType = 'student' } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });

    const payload = {
      title,
      message,
      type: type || 'info',
      actionUrl: actionUrl ?? null,
      recipientType,
    };

    if (recipientType === 'admin') {
      payload.adminId = String(req.user.userId);
    } else {
      if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required for student notifications' });
      payload.studentId = studentId;
    }

    const notif = await Notification.create(payload);
    return res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] CreateAdminNotification error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudentNotifications,
  getAdminNotifications,
  getAdminUnreadCount,
  markNotificationRead,
  markAdminNotificationRead,
  createAdminNotification,
};
