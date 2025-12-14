/**
 * backend/app.js (2025) - Fully Integrated
 *
 * - Loads all API routes from routes/index.js
 * - Sets up security middlewares, CORS, helmet, etc.
 * - Serves uploads/kyc and assets with suitable HTTP headers
 * - Exposes global app object to server.js
 * - Handles 404 and error globally
 *
 * Note: app.locals.dbConnected is consulted by startup code (server.js).
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');

const apiRouter = require('./routes/index');

const app = express();

// default DB status until server sets it
app.locals.dbConnected = false;

// Security and logging middleware
app.use(helmet());
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS Setup
// You can set CORS_ORIGINS="https://aexon-frontend.onrender.com,https://other" OR set REACT_APP_FRONTEND_URL for single value.
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.REACT_APP_FRONTEND_URL || '';
const allowedOrigins = corsOriginsEnv ? corsOriginsEnv.split(',').map(s => s.trim()).filter(Boolean) : [];

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser (curl, Postman) requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true); // open if nothing configured
    // allow exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // allow origin without trailing slash variations
    const trimmed = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(trimmed)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Attach user if Bearer token present (for upload protection, etc.)
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || 'change_this_secret';
let UserModel = null;
try { UserModel = require('./models/User'); } catch (e) { /* optional model */ }

app.use(async (req, res, next) => {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) { req.user = null; return next(); }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id || payload._id || payload.userId || payload.sub;
    // If DB is not connected, avoid attempting DB lookups
    if (!app.locals.dbConnected || !UserModel || !userId) {
      req.user = payload;
      return next();
    }
    try {
      req.user = userId ? (await UserModel.findById(userId).lean()) : payload;
    } catch (e) {
      // If a DB error occurs, fallback to token payload and continue
      req.user = payload;
    }
  } catch (e) {
    req.user = null;
  }
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

// DB-availability middleware for API routes.
// If DB is not connected, we short-circuit most /api routes with 503, but allow:
//  - GET /api/health
//  - GET /api (API root) -- helpful for basic discovery
app.use((req, res, next) => {
  try {
    const isApiPath = req.path && req.path.startsWith('/api');
    if (!isApiPath) return next();

    const allowedWhenDbDown = ['/api', '/api/health'];
    const fullPath = req.path;

    if (app.locals.dbConnected) return next();
    if (allowedWhenDbDown.includes(fullPath)) return next();

    // Return clear 503 for DB-backed endpoints
    return res.status(503).json({
      success: false,
      error: 'Service unavailable: database offline. In local development you may set LOCAL_SKIP_DB=true or start MongoDB. In production the database is required.'
    });
  } catch (e) {
    // In case of unexpected errors in middleware, allow request through to avoid accidental outage.
    return next();
  }
});

// Load all main API routes
app.use('/api', apiRouter);

// Global health endpoint (compat) - kept here for completeness; routes/index also exposes /health
app.get('/api/health', (req, res) => res.json({
  ok: true,
  uptime: process.uptime(),
  env: process.env.NODE_ENV || 'development',
  dbConnected: !!app.locals.dbConnected
}));

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found.' });
});

// Error boundary
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err && (err.message || 'Internal Server Error') });
});

module.exports = app;