const User = require('../models/User');
const Request = require('../models/Request');
const Book = require('../models/Book');
const AdminSettings = require('../models/AdminSettings');
const AuditLog = require('../models/AuditLog');
const BackupJob = require('../models/BackupJob');
const Notification = require('../models/Notification');
const { getIssuedCountsByBookId, attachAvailability } = require('../services/inventoryService');
const { writeAuditLog } = require('../utils/auditLogger');
const { resolveAdminName } = require('../utils/adminContext');

const percentDelta = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const getUsers = async (req, res) => {
  try {
    const { search, membershipStatus, course, accountStatus, page = 1, limit = 20 } = req.query;
    const filter = { role: 'student' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (membershipStatus) filter.membershipStatus = membershipStatus;
    if (course) filter.course = course;
    if (accountStatus) filter.accountStatus = accountStatus;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return res.json({ success: true, users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Admin] GetUsers error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { membershipStatus, accountStatus, name, phone, email, course, academicYear } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });

    if (membershipStatus) user.membershipStatus = membershipStatus;
    if (accountStatus) user.accountStatus = accountStatus;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (course !== undefined) user.course = course;
    if (academicYear !== undefined) user.academicYear = academicYear;

    await user.save();

    await writeAuditLog(req, {
      action: accountStatus === 'Suspended' ? 'Suspended Student' : 'Updated Student',
      module: 'Students',
      details: `Updated student ${user.studentId || user._id}`,
      meta: { userId: String(user._id), accountStatus: user.accountStatus, membershipStatus: user.membershipStatus },
    });

    return res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    console.error('[Admin] UpdateUser error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });

    user.accountStatus = 'Inactive';
    await user.save();

    await writeAuditLog(req, {
      action: 'Deleted Student',
      module: 'Students',
      result: 'Warning',
      details: `Deactivated student ${user.studentId || user._id} (${user.name || 'Unknown'})`,
      meta: { userId: String(user._id) },
    });

    return res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    console.error('[Admin] DeleteUser error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const { status, search, course, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (course) filter.studentCourse = course;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total, pendingCount, completedCount, manualCount] = await Promise.all([
      Request.find(filter)
        .populate('userId', '-passwordHash')
        .populate('selectedBookIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Request.countDocuments(filter),
      Request.countDocuments({ status: 'Pending' }),
      Request.countDocuments({ status: { $in: ['Approved', 'Procured', 'Completed', 'Returned', 'Rejected'] } }),
      Request.countDocuments({ 'requestedBooks.0': { $exists: true } }),
    ]);

    return res.json({
      success: true,
      requests,
      total,
      page: Number(page),
      limit: Number(limit),
      tabCounts: { pending: pendingCount, completed: completedCount, manual: manualCount },
    });
  } catch (err) {
    console.error('[Admin] GetRequests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const canonicalizeDecision = (decision) => {
  const raw = String(decision ?? '').trim();
  const normalized = raw.toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'requested':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'reserved':
    case 'acceptreservation':
    case 'accept_reservation':
      return 'Reserved';
    case 'ordered':
      return 'Ordered';
    case 'arrived':
    case 'reachedoffice':
    case 'reached office':
      return 'Arrived';
    case 'readyforcollection':
    case 'ready_for_collection':
      return 'ReadyForCollection';
    case 'issued':
    case 'collected':
      return 'Issued';
    case 'returned':
      return 'Returned';
    case 'procured':
      return 'Procured';
    case 'specialorder':
      return 'SpecialOrder';
    default:
      return raw || 'Pending';
  }
};

const getManualBooksToPurchase = async (req, res) => {
  try {
    const requests = await Request.find({ 'requestedBooks.0': { $exists: true } })
      .populate('userId', '-passwordHash')
      .sort({ createdAt: -1 });

    const manualBooks = [];

    for (const request of requests) {
      const student = request.userId || {};
      const base = {
        requestId: String(request._id),
        studentId: String(request.studentId ?? student.studentId ?? ''),
        studentName: String(request.studentName ?? student.name ?? ''),
        studentCourse: String(request.studentCourse ?? student.course ?? ''),
        studentYear: String(request.studentYear ?? ''),
        studentPhone: String(request.studentPhone ?? student.phone ?? ''),
        collectionDate: '',
        collectionTime: '',
        collectionLocation: '',
        requestNumber: String(request._id),
      };

      if (Array.isArray(request.requestedBooks)) {
        request.requestedBooks.forEach((book, index) => {
          const status = canonicalizeDecision(book.decision);
          if (!status || status === 'Rejected' || status === 'Pending') return;
          manualBooks.push({
            ...base,
            manualIndex: index,
            procurement: {
              id: `${String(request._id)}:${index}`,
              bookTitle: String(book.title ?? ''),
              author: String(book.author ?? ''),
              edition: String(book.edition ?? ''),
              publisher: String(book.publisher ?? ''),
              status,
              isPurchased: Boolean(book.isPurchased),
              purchaseBatchId: String(book.purchaseBatchId ?? ''),
              purchasePdfUrl: String(book.purchasePdfUrl ?? ''),
            },
          });
        });
      }
    }

    return res.json({ success: true, manualBooks });
  } catch (err) {
    console.error('[Admin] GetManualBooksToPurchase error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const [totalStudents, totalPaidStudents, totalBooks, totalRequests, pendingRequests, approvedRequests] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'student', membershipStatus: 'PAID' }),
        Book.countDocuments(),
        Request.countDocuments(),
        Request.countDocuments({ status: 'Pending' }),
        Request.countDocuments({ status: { $in: ['Approved', 'Procured'] } }),
      ]);

    // Count total issued books across all users
    const usersWithBooks = await User.find({ 'issuedBooks.0': { $exists: true } }, 'issuedBooks');
    const totalBooksIssued = usersWithBooks.reduce((sum, u) => sum + u.issuedBooks.length, 0);

    return res.json({
      success: true,
      analytics: {
        totalStudents,
        totalPaidStudents,
        totalBooks,
        totalRequests,
        pendingRequests,
        approvedRequests,
        totalBooksIssued,
      },
    });
  } catch (err) {
    console.error('[Admin] GetAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getReturnTimeline = async (req, res) => {
  try {
    const requests = await Request.find({ status: { $in: ['Approved', 'Procured'] } })
      .populate('userId', 'name email studentId course profilePhoto')
      .sort({ createdAt: -1 });

    const now = new Date();
    const timeline = [];

    for (const req of requests) {
      for (const book of req.selectedBooks) {
        if (!book.returned && book.returnDate) {
          const daysRemaining = Math.ceil((new Date(book.returnDate) - now) / (1000 * 60 * 60 * 24));
          let urgency = 'green';
          if (daysRemaining <= 2) urgency = 'red';
          else if (daysRemaining <= 5) urgency = 'yellow';

          const student = req.userId;
          timeline.push({
            requestId: String(req._id),
            bookId: String(book.bookId || ''),
            studentName: student ? student.name : 'Unknown',
            studentId: student ? (student.studentId || String(student._id)) : '',
            studentEmail: student ? student.email : '',
            bookTitle: book.title,
            bookAuthor: book.author,
            issueDate: book.issueDate,
            returnDate: book.returnDate,
            daysRemaining,
            urgency,
          });
        }
      }
    }

    timeline.sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));

    return res.json({ success: true, timeline });
  } catch (err) {
    console.error('[Admin] GetReturnTimeline error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const [analytics, returnTimeline, recentRequests, requestTrends, inventoryTrends, categoryBreakdown, kpiTrends] = await Promise.all([
      getAnalyticsInternal(),
      getReturnTimelineInternal(),
      Request.find({ status: { $in: ['Approved', 'Procured', 'Returned'] } })
        .populate('userId', 'name studentId')
        .sort({ updatedAt: -1 })
        .limit(6),
      getRequestTrendSeries(),
      getInventoryTrendSeries(),
      getCategoryBreakdown(),
      getKpiTrendDeltas(),
    ]);

    const kpis = [
      { label: 'Total Books', value: analytics.totalBooks, icon: 'BookOpen', trend: kpiTrends.totalBooks, color: 'blue', sub: 'Across all categories' },
      { label: 'Books Issued', value: analytics.totalBooksIssued, icon: 'BookMarked', trend: kpiTrends.totalBooksIssued, color: 'sky', sub: 'Currently with students' },
      { label: 'Pending Requests', value: analytics.pendingRequests, icon: 'Clock', trend: kpiTrends.pendingRequests, color: 'amber', sub: 'Awaiting approval' },
      { label: 'Manual Requests', value: analytics.manualRequests, icon: 'FileText', trend: kpiTrends.manualRequests, color: 'purple', sub: 'Walk-in requests' },
      { label: 'Available Inventory', value: analytics.availableBooks, icon: 'Archive', trend: kpiTrends.availableBooks, color: 'green', sub: 'Ready to issue' },
      { label: 'Returned Books', value: analytics.returnedBooks, icon: 'RefreshCw', trend: kpiTrends.returnedBooks, color: 'teal', sub: 'This month' },
      { label: 'Pending Returns', value: analytics.pendingReturns, icon: 'AlertCircle', trend: kpiTrends.pendingReturns, color: 'orange', sub: 'Overdue or upcoming' },
      { label: 'Late Returns', value: analytics.lateReturns, icon: 'XCircle', trend: kpiTrends.lateReturns, color: 'red', sub: 'Fine applicable' },
    ];

    const recentItems = recentRequests.map((item) => ({
      requestNo: String(item._id),
      requestId: String(item._id),
      student: item.studentName || item.userId?.name || 'Unknown student',
      studentId: item.studentId || item.userId?.studentId || '',
      books: Array.isArray(item.selectedBooks) ? item.selectedBooks.length : 0,
      approvedOn: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
      status: item.status,
    }));

    return res.json({
      success: true,
      dashboard: {
        kpis,
        recentRequests: recentItems,
        returnTimeline,
        requestTrendData: requestTrends,
        inventoryTrendData: inventoryTrends,
        categoryData: categoryBreakdown,
      },
    });
  } catch (err) {
    console.error('[Admin] GetDashboardOverview error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne({ key: 'default' });
    if (!settings) {
      settings = await AdminSettings.create({ key: 'default' });
    }
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('[Admin] GetAdminSettings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminSettings = async (req, res) => {
  try {
    const updates = req.body || {};
    const settings = await AdminSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('[Admin] UpdateAdminSettings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const [bookCount, requestCount, notificationCount, auditCount] = await Promise.all([
      Book.countDocuments(),
      Request.countDocuments(),
      Notification.countDocuments(),
      AuditLog.countDocuments(),
    ]);
    return res.json({
      success: true,
      health: {
        status: 'ok',
        bookCount,
        requestCount,
        notificationCount,
        auditCount,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] GetSystemHealth error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getBackupJobs = async (req, res) => {
  try {
    let backups = await BackupJob.find().sort({ createdAt: -1 }).limit(20).lean();
    if (backups.length === 0) {
      const settings = await AdminSettings.findOne({ key: 'default' });
      const backup = settings?.backup || {};
      const seeded = await BackupJob.create({
        name: 'Default backup job',
        status: backup.enabled === false ? 'scheduled' : 'completed',
        type: 'automatic',
        completedAt: settings?.system?.healthCheckLastRunAt || new Date(),
      });
      backups = [seeded.toObject()];
    }
    return res.json({ success: true, backups });
  } catch (err) {
    console.error('[Admin] GetBackupJobs error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ key: 'default' });
    const displayName = settings?.adminProfile?.displayName?.trim() || req.user?.name || 'Admin';
    const email = settings?.adminProfile?.email?.trim() || req.user?.username || '';
    const role = settings?.permissions?.defaultRole || 'super_admin';
    return res.json({
      success: true,
      profile: {
        id: req.user?.userId || 'admin',
        name: displayName,
        email,
        role,
        username: req.user?.username || null,
      },
    });
  } catch (err) {
    console.error('[Admin] GetAdminProfile error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportInventory = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;

    const [books, issuedCounts] = await Promise.all([
      Book.find(filter).sort({ title: 1 }).limit(500),
      getIssuedCountsByBookId(),
    ]);
    const enriched = attachAvailability(books, issuedCounts);

    const header = ['title', 'author', 'publisher', 'category', 'edition', 'quantity', 'available', 'issued'];
    const rows = enriched.map((book) => [
      book.title || '',
      book.author || '',
      book.publisher || '',
      book.category || '',
      book.edition || '',
      book.quantity || 0,
      book.availableQuantity || 0,
      book.issuedCount || 0,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    await writeAuditLog(req, {
      action: 'Exported Data',
      module: 'Inventory',
      details: `Exported ${enriched.length} inventory rows as CSV`,
      meta: { count: enriched.length },
    });

    res.type('text/csv').send(csv);
  } catch (err) {
    console.error('[Admin] ExportInventory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalyticsInternal = async () => {
  const [totalStudents, totalPaidStudents, totalBooks, totalRequests, pendingRequests, approvedRequests, returnedRequests] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', membershipStatus: 'PAID' }),
    Book.countDocuments(),
    Request.countDocuments(),
    Request.countDocuments({ status: 'Pending' }),
    Request.countDocuments({ status: { $in: ['Approved', 'Procured'] } }),
    Request.countDocuments({ status: 'Returned' }),
  ]);

  const usersWithBooks = await User.find({ 'issuedBooks.0': { $exists: true } }, 'issuedBooks');
  const totalBooksIssued = usersWithBooks.reduce((sum, u) => sum + u.issuedBooks.length, 0);

  const books = await Book.find({}, 'quantity');
  const issuedCounts = await getIssuedCountsByBookId();
  const availableBooks = books.reduce((sum, book) => {
    const issued = issuedCounts[String(book._id)] || 0;
    return sum + Math.max(0, Number(book.quantity || 0) - issued);
  }, 0);

  const pendingReturns = await Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returnDate': { $exists: true } });
  const lateReturns = await Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returned': false, 'selectedBooks.returnDate': { $lt: new Date() } });

  return {
    totalStudents,
    totalPaidStudents,
    totalBooks,
    totalRequests,
    pendingRequests,
    approvedRequests,
    totalBooksIssued,
    returnedBooks: returnedRequests,
    manualRequests: await Request.countDocuments({ 'requestedBooks.0': { $exists: true } }),
    availableBooks,
    pendingReturns,
    lateReturns,
  };
};

const getReturnTimelineInternal = async () => {
  const requests = await Request.find({ status: { $in: ['Approved', 'Procured'] } })
    .populate('userId', 'name email studentId course profilePhoto')
    .sort({ createdAt: -1 });

  const now = new Date();
  const timeline = [];

  for (const req of requests) {
    for (const book of req.selectedBooks || []) {
      if (!book.returned && book.returnDate) {
        const daysRemaining = Math.ceil((new Date(book.returnDate) - now) / (1000 * 60 * 60 * 24));
        let status = 'Due Soon';
        if (daysRemaining <= 2) status = 'Critical';
        const student = req.userId;
        timeline.push({
          requestId: String(req._id),
          bookId: String(book.bookId || ''),
          student: student ? student.name : 'Unknown',
          studentId: student ? (student.studentId || String(student._id)) : '',
          title: book.title,
          dueDate: book.returnDate.toISOString().slice(0, 10),
          daysRemaining,
          status,
        });
      }
    }
  }

  timeline.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return timeline;
};

const getRequestTrendSeries = async () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 7, 1);
  const series = [];

  for (let i = 0; i < 8; i += 1) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    const online = await Request.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } });
    const manual = await Request.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, 'requestedBooks.0': { $exists: true } });
    series.push({ month: months[monthStart.getMonth()], online, manual });
  }

  return series;
};

const getInventoryTrendSeries = async () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 7, 1);
  const series = [];

  for (let i = 0; i < 8; i += 1) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    const added = await Book.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } });
    const issued = await Request.countDocuments({ status: { $in: ['Approved', 'Procured', 'Returned'] }, createdAt: { $gte: monthStart, $lte: monthEnd } });
    series.push({ month: months[monthStart.getMonth()], added, issued });
  }

  return series;
};

const getCategoryBreakdown = async () => {
  const books = await Book.find({}, 'category quantity');
  const counts = books.reduce((acc, book) => {
    const category = book.category || 'General';
    acc[category] = (acc[category] || 0) + (Number(book.quantity) || 1);
    return acc;
  }, {});

  const colors = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return Object.entries(counts).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
};

const monthRange = (offsetMonths = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getKpiTrendDeltas = async () => {
  const current = monthRange(0);
  const previous = monthRange(-1);

  const [
    booksCurrent,
    booksPrevious,
    issuedCurrent,
    issuedPrevious,
    pendingCurrent,
    pendingPrevious,
    manualCurrent,
    manualPrevious,
    returnedCurrent,
    returnedPrevious,
    pendingReturnsCurrent,
    pendingReturnsPrevious,
    lateCurrent,
    latePrevious,
  ] = await Promise.all([
    Book.countDocuments({ createdAt: { $lte: current.end } }),
    Book.countDocuments({ createdAt: { $lte: previous.end } }),
    User.aggregate([
      { $match: { 'issuedBooks.0': { $exists: true } } },
      { $project: { count: { $size: '$issuedBooks' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]).then((r) => r[0]?.total || 0),
    User.aggregate([
      { $match: { 'issuedBooks.0': { $exists: true }, updatedAt: { $lte: previous.end } } },
      { $project: { count: { $size: '$issuedBooks' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]).then((r) => r[0]?.total || 0),
    Request.countDocuments({ status: 'Pending', createdAt: { $gte: current.start, $lte: current.end } }),
    Request.countDocuments({ status: 'Pending', createdAt: { $gte: previous.start, $lte: previous.end } }),
    Request.countDocuments({ 'requestedBooks.0': { $exists: true }, createdAt: { $gte: current.start, $lte: current.end } }),
    Request.countDocuments({ 'requestedBooks.0': { $exists: true }, createdAt: { $gte: previous.start, $lte: previous.end } }),
    Request.countDocuments({ status: 'Returned', updatedAt: { $gte: current.start, $lte: current.end } }),
    Request.countDocuments({ status: 'Returned', updatedAt: { $gte: previous.start, $lte: previous.end } }),
    Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returnDate': { $exists: true }, updatedAt: { $gte: current.start, $lte: current.end } }),
    Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returnDate': { $exists: true }, updatedAt: { $gte: previous.start, $lte: previous.end } }),
    Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returned': false, 'selectedBooks.returnDate': { $lt: new Date() }, updatedAt: { $gte: current.start, $lte: current.end } }),
    Request.countDocuments({ status: { $in: ['Approved', 'Procured'] }, 'selectedBooks.returned': false, 'selectedBooks.returnDate': { $lt: previous.end }, updatedAt: { $gte: previous.start, $lte: previous.end } }),
  ]);

  const analytics = await getAnalyticsInternal();

  return {
    totalBooks: percentDelta(booksCurrent, booksPrevious),
    totalBooksIssued: percentDelta(issuedCurrent, issuedPrevious),
    pendingRequests: percentDelta(pendingCurrent, pendingPrevious),
    manualRequests: percentDelta(manualCurrent, manualPrevious),
    availableBooks: percentDelta(analytics.availableBooks, Math.max(0, analytics.availableBooks - (booksCurrent - booksPrevious))),
    returnedBooks: percentDelta(returnedCurrent, returnedPrevious),
    pendingReturns: percentDelta(pendingReturnsCurrent, pendingReturnsPrevious),
    lateReturns: percentDelta(lateCurrent, latePrevious),
  };
};

module.exports = {
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
};
