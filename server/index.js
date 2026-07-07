require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { seedBooks } = require('./services/bookService');

// Global OTP store for demo mode
global.otpStore = new Map();

// Route modules
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const requestRoutes = require('./routes/requests');
const challanRoutes = require('./routes/challans');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/students');
const procurementRoutes = require('./routes/procurement');
const { studentRouter: studentNotificationsRouter, adminRouter: adminNotificationsRouter } = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'SVGA Book Bank API', madeBy: 'Devansh Nisar' }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/student/notifications', studentNotificationsRouter);
app.use('/api/admin/notifications', adminNotificationsRouter);

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// --- Start ---
const start = async () => {
  const connected = await connectDB();
  if (connected) {
    await seedBooks();
  } else {
    console.warn('[Server] MongoDB not connected; skipping book seeding.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] SVGA Book Bank API running on port ${PORT}`);
    console.log(`[Server] Made by Devansh Nisar`);
  });
};

start();
