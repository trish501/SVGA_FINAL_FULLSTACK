const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getUsers,
  updateUser,
  deleteUser,
  getRequests,
  getAnalytics,
  getReturnTimeline,
  getManualBooksToPurchase,
  getDashboardOverview,
  getAdminSettings,
  updateAdminSettings,
  getSystemHealth,
  getBackupJobs,
  getAdminProfile,
  exportInventory,
} = require('../controllers/adminController');
const Request = require('../models/Request');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { writeAuditLog } = require('../utils/auditLogger');

router.use(authMiddleware, adminMiddleware);


router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/profile', getAdminProfile);
router.get('/inventory/export', exportInventory);
router.get('/requests', getRequests);
router.get('/manual-books', getManualBooksToPurchase);
router.get('/analytics', getAnalytics);
router.get('/return-timeline', getReturnTimeline);
router.get('/dashboard', getDashboardOverview);
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.get('/settings/health', getSystemHealth);
router.get('/settings/backups', getBackupJobs);

// Admin: update request status (used by useMarkBookReturned and useUpdateRequestStatus)
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Procured', 'Rejected', 'Returned', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', '-passwordHash').populate('selectedBookIds');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // create notification for the student about status change
    try {
      const student = request.userId;
      const title = `Request ${String(request._id)} — ${status}`;
      const message = `Your request ${String(request._id)} status changed to ${status}.`;
      if (student && student._id) {
        const actionUrl = `/student/challan/${String(request._id)}`;
        await Notification.create({ studentId: student._id, title, message, type: 'request', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create notification on admin status update:', e);
    }

    // Audit log
    await writeAuditLog(req, {
      action: 'Updated Request Status',
      module: 'Book Requests',
      result: 'Success',
      details: `Request ${String(request._id)} status -> ${status}`,
      meta: { requestId: String(request._id), status },
    });

    return res.json({ success: true, request });

  } catch (err) {
    // Audit log failure
    try {
      const adminName = req.user?.name || 'System';
      await require('../models/AuditLog').create({
        adminUserId: req.user?.userId,
        adminName,
        action: 'Updated Request Status',
        module: 'Book Requests',
        result: 'Failed',
        details: `Failed to update status for request ${req.params.id}`,
        meta: { requestId: req.params.id, error: err.message },
      });
    } catch (e) {
      console.error('[AuditLog] Failed to create failure log for request status update:', e);
    }

    console.error('[Admin] UpdateRequestStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update per-book decision (approve/reject/etc. for individual books)
router.patch('/requests/:id/book-decision', async (req, res) => {
  try {
    const { bookId, decision, isManualBook, bookIndex, decisions } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const decisionMap = {
      pending: 'Pending',
      requested: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      buy: 'Buy',
      reserved: 'Reserved',
      acceptreservation: 'Reserved',
      accept_reservation: 'Reserved',
      ordered: 'Ordered',
      arrived: 'Arrived',
      'reached office': 'Arrived',
      reachedoffice: 'Arrived',
      readyforcollection: 'ReadyForCollection',
      ready_for_collection: 'ReadyForCollection',
      issued: 'Issued',
      collected: 'Issued',
      returned: 'Returned',
      procured: 'Procured',
      specialorder: 'SpecialOrder',
    };

    const normalizeDecision = (raw) => {
      const normalized = String(raw ?? '').trim().toLowerCase();
      return decisionMap[normalized];
    };

    const applyDecision = ({ bookId, decision, isManualBook, bookIndex }) => {
      const canonicalDecision = normalizeDecision(decision);
      if (!canonicalDecision) {
        throw new Error('Invalid decision');
      }

      if (isManualBook && typeof bookIndex === 'number') {
        if (request.requestedBooks[bookIndex]) {
          request.requestedBooks[bookIndex].decision = canonicalDecision;
        }
      } else if (typeof bookId === 'string' && bookId.trim() !== '') {
        const idx = Array.isArray(request.selectedBookIds)
          ? request.selectedBookIds.findIndex((id) => String(id) === String(bookId))
          : -1;
        if (idx >= 0 && request.selectedBooks[idx]) {
          request.selectedBooks[idx].decision = canonicalDecision;
        }
      } else {
        throw new Error('Missing bookId or manual book index');
      }

      return canonicalDecision;
    };

    const appliedDecisions = [];
    if (Array.isArray(decisions) && decisions.length > 0) {
      for (const item of decisions) {
        const canonicalDecision = applyDecision(item);
        appliedDecisions.push({ ...item, decision: canonicalDecision });
      }
    } else {
      const canonicalDecision = applyDecision({ bookId, decision, isManualBook, bookIndex });
      appliedDecisions.push({ bookId, decision: canonicalDecision, isManualBook, bookIndex });
    }

    const hasLibraryBooks = Array.isArray(request.selectedBooks) && request.selectedBooks.length > 0;
    const hasSpecialBooks = Array.isArray(request.requestedBooks) && request.requestedBooks.length > 0;
    const anyApproved = (hasLibraryBooks && request.selectedBooks.some((book) => book.decision === 'Approved')) || (hasSpecialBooks && request.requestedBooks.some((book) => book.decision === 'Approved'));
    const anyBuy = hasSpecialBooks && request.requestedBooks.some((book) => book.decision === 'Buy');
    const allLibraryDecided = !hasLibraryBooks || request.selectedBooks.every((book) => book.decision && book.decision !== 'Pending');
    const allSpecialDecided = !hasSpecialBooks || request.requestedBooks.every((book) => book.decision && book.decision !== 'Pending');
    const allRejected = (hasLibraryBooks ? request.selectedBooks.every((book) => book.decision === 'Rejected') : true) && (hasSpecialBooks ? request.requestedBooks.every((book) => book.decision === 'Rejected') : true);

    if (anyBuy) {
      request.status = 'Completed';
    } else if (anyApproved) {
      request.status = 'Approved';
    } else if (allLibraryDecided && allSpecialDecided && allRejected) {
      request.status = 'Rejected';
    }

    await request.save();

    try {
      const student = request.userId;
      const title = `Request ${String(request._id)} — Book decision updated`;
      const message = `A decision was made on one of the books in your request ${String(request._id)}.`;
      if (student && student._id) {
        const actionUrl = `/student/challan/${String(request._id)}`;
        await Notification.create({ studentId: student._id, title, message, type: 'request', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create notification for book decision:', e);
    }

    await writeAuditLog(req, {
      action: 'Updated Request Book Decision',
      module: 'Book Requests',
      result: 'Success',
      details: `Request ${String(request._id)} book decisions updated`,
      meta: { requestId: String(request._id), decisions: appliedDecisions },
    });

    return res.json({ success: true, request: await request.populate('selectedBookIds') });
  } catch (err) {
    try {
      const adminName = req.user?.name || 'System';
      await require('../models/AuditLog').create({
        adminUserId: req.user?.userId,
        adminName,
        action: 'Updated Request Book Decision',
        module: 'Book Requests',
        result: 'Failed',
        details: `Failed to update decision for request ${req.params.id}`,
        meta: { requestId: req.params.id, error: err.message },
      });
    } catch (e) {
      console.error('[AuditLog] Failed to create failure log for book decision update:', e);
    }

    console.error('[Admin] UpdateBookDecision error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: set return date for a request
router.patch('/requests/:id/return-date', async (req, res) => {
  try {
    const { returnDate } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    // Update returnDate on all selectedBooks in the request
    request.selectedBooks = request.selectedBooks.map(b => ({ ...b, returnDate: new Date(returnDate) }));
    await request.save();

    // Audit log
    try {
      const adminName = req.user?.name || 'System';
      await require('../models/AuditLog').create({
        adminUserId: req.user?.userId,
        adminName,
        action: 'Set Request Return Date',
        module: 'Book Requests',
        result: 'Success',
        details: `Request ${String(request._id)} returnDate -> ${new Date(returnDate).toISOString()}`,
        meta: { requestId: String(request._id), returnDate },
      });
    } catch (e) {
      console.error('[AuditLog] Failed to create log for return-date update:', e);
    }

    return res.json({ success: true, request });
  } catch (err) {
    // Audit log failure
    try {
      const adminName = req.user?.name || 'System';
      await require('../models/AuditLog').create({
        adminUserId: req.user?.userId,
        adminName,
        action: 'Set Request Return Date',
        module: 'Book Requests',
        result: 'Failed',
        details: `Failed to set return date for request ${req.params.id}`,
        meta: { requestId: req.params.id, error: err.message },
      });
    } catch (e) {
      console.error('[AuditLog] Failed to create failure log for return-date update:', e);
    }

    console.error('[Admin] SetReturnDate error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: seed/bulk books
router.post('/books/seed', async (req, res) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'books array required' });
    }
    const inserted = await Book.insertMany(books, { ordered: false });
    return res.json({ success: true, inserted: inserted.length });
  } catch (err) {
    console.error('[Admin] SeedBooks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

