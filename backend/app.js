/**
 * backend/app.js (2025) - Fully Integrated
 *
 * - Loads all API routes from routes/index.js
 * - Sets up security middlewares, CORS, helmet, etc.
 * - Serves uploads/kyc and assets with suitable HTTP headers
 * - Exposes global app object to server.js
 * - Handles 404 and error globally
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const apiRouter = require('./routes/index');

const app = express();

// Security and logging middleware
app.use(helmet());
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS Setup
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.REACT_APP_FRONTEND_URL || '';
const allowedOrigins = corsOriginsEnv ? corsOriginsEnv.split(',').map(s => s.trim()).filter(Boolean) : [];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Attach user if Bearer token present (for upload protection, etc.)
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || 'change_this_secret';
let UserModel = null;
try { UserModel = require('./models/User'); } catch (e) {}
app.use(async (req, res, next) => {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) { req.user = null; return next(); }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id || payload._id || payload.sub;
    req.user = userId && UserModel ? (await UserModel.findById(userId).lean()) : payload;
  } catch { req.user = null; }
  next();
});

// Static /assets/ and /uploads/kyc/ route, with CORS and cache headers
const publicPath = path.join(process.cwd(), 'public');
app.use('/assets', express.static(path.join(publicPath, 'assets'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));
const uploadsKycPath = path.join(process.cwd(), 'uploads', 'kyc');
app.use('/uploads/kyc', express.static(uploadsKycPath, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));

// Load all main API routes
app.use('/api', apiRouter);

// Global health endpoint (compat)
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV || 'development' }));

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found.' });
});

// Error boundary
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  res.status(500).json({ error: err && (err.message || 'Internal Server Error') });
});

module.exports = app;