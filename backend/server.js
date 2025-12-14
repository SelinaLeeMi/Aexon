/**
 * backend/server.js — Full Modern Entrypoint (2025)
 * - Loads main app from app.js
 * - Handles WS, Socket.IO, Redis broadcast, static files
 * - Robust error/logging/shutdown handlers
 * - Starts DB-dependent services only when MongoDB is connected
 *
 * Behavior:
 * - production (NODE_ENV=production): MongoDB connection is required (fail-fast).
 * - non-production: server boots even if DB connection fails; DB-dependent features remain disabled until DB connects.
 */

const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load .env as early as possible
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// Helper to produce a best-effort public URL for logs
function publicUrl() {
  return process.env.APP_URL || process.env.FRONTEND_URL || process.env.PRIMARY_URL || `http://localhost:${PORT}`;
}

// Global error handlers (prevent process exit without logging)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && (err.stack || err));
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Global DB-connected flag (used by app.js middleware)
global.__DB_CONNECTED__ = false;

// Handles for DB-dependent services to allow stopping them on disconnect
let dbServiceHandles = {
  priceEngineStop: null,
  simulatorStop: null,
  randomizerStop: null
};

function startDbServices() {
  // start price engine
  if (!dbServiceHandles.priceEngineStop) {
    try {
      const startPriceEngine = require('./jobs/priceUpdater');
      if (typeof startPriceEngine === 'function') {
        dbServiceHandles.priceEngineStop = startPriceEngine();
        console.log('Price engine started (jobs/priceUpdater).');
      }
    } catch (e) {
      console.warn('Price engine not started:', e && (e.message || e));
    }
  }

  // start custom coin simulator if present
  if (!dbServiceHandles.simulatorStop) {
    try {
      const simulator = require('./utils/coinPriceSimulator');
      if (simulator && typeof simulator.startSimulator === 'function') {
        dbServiceHandles.simulatorStop = simulator.startSimulator();
        console.log('Coin simulator started (utils/coinPriceSimulator).');
      }
    } catch (e) {
      console.warn('Coin simulator not started:', e && (e.message || e));
    }
  }

  // start price randomizer if present
  if (!dbServiceHandles.randomizerStop) {
    try {
      const randomizer = require('./utils/priceRandomizer');
      if (randomizer && typeof randomizer.startPriceRandomizer === 'function') {
        dbServiceHandles.randomizerStop = randomizer.startPriceRandomizer();
        console.log('Price randomizer started (utils/priceRandomizer).');
      }
    } catch (e) {
      console.warn('Price randomizer not started:', e && (e.message || e));
    }
  }
}

function stopDbServices() {
  try {
    if (dbServiceHandles.priceEngineStop && typeof dbServiceHandles.priceEngineStop === 'function') {
      dbServiceHandles.priceEngineStop();
      dbServiceHandles.priceEngineStop = null;
      console.log('Price engine stopped.');
    }
  } catch (e) { console.warn('Failed stopping price engine:', e && e.message); }
  try {
    if (dbServiceHandles.simulatorStop && typeof dbServiceHandles.simulatorStop === 'function') {
      dbServiceHandles.simulatorStop();
      dbServiceHandles.simulatorStop = null;
      console.log('Coin simulator stopped.');
    }
  } catch (e) { console.warn('Failed stopping simulator:', e && e.message); }
  try {
    if (dbServiceHandles.randomizerStop && typeof dbServiceHandles.randomizerStop === 'function') {
      dbServiceHandles.randomizerStop();
      dbServiceHandles.randomizerStop = null;
      console.log('Price randomizer stopped.');
    }
  } catch (e) { console.warn('Failed stopping randomizer:', e && e.message); }
}

async function main() {
  // Attempt to connect to MongoDB (if provided).
  if (MONGODB_URI) {
    try {
      // Mongoose v7 doesn't require these options but harmless to include for compatibility
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      global.__DB_CONNECTED__ = true;
      console.log('MongoDB connected.');
    } catch (err) {
      console.error('MongoDB connection error:', err && (err.message || err));
      // Production must fail fast
      if (process.env.NODE_ENV === 'production') {
        console.error('Production requires MongoDB. Exiting.');
        process.exit(1);
      } else {
        console.warn('Continuing without MongoDB (non-production). DB-dependent features disabled until DB connects.');
      }
    }
  } else {
    console.warn('MONGODB_URI not set. Some features will not work.');
    // In production, absence should be treated as fatal
    if (process.env.NODE_ENV === 'production') {
      console.error('Production requires MONGODB_URI. Exiting.');
      process.exit(1);
    }
  }

  // Load express app (app.js should export the Express app)
  const app = require('./app');

  // Sync initial DB-connected flag to app.locals so middleware can read it
  app.locals.dbConnected = !!global.__DB_CONNECTED__;

  const server = http.createServer(app);

  // Socket.IO
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
        credentials: true
      }
    });
    global.io = io;
    io.on('connection', (socket) => {
      console.log('Socket.IO client connected', socket.id);
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected', socket.id, reason);
      });
    });
    io.on('error', (e) => console.warn('Socket.IO error:', e && e.message));
    console.log('Socket.IO attached @ /socket.io (global.io)');
  } catch (e) {
    console.warn('Socket.IO not attached:', e && (e.message || e));
  }

  // Native ws at /ws
  try {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server, path: '/ws' });
    global.wss = wss;
    wss.on('connection', (ws) => {
      try { ws.send(JSON.stringify({ type: 'connected', ts: Date.now() })); } catch {}
    });
    wss.on('error', (e) => console.warn('ws server error:', e && e.message));
    console.log('Native WebSocket attached @ /ws (global.wss)');
  } catch (e) {
    console.warn('ws not available:', e && (e.message || e));
  }

  // Redis PUB/SUB subscriber for broadcast channel (safe non-fatal handling)
  if (process.env.REDIS_URL) {
    try {
      const IORedis = require('ioredis');
      const sub = new IORedis(process.env.REDIS_URL);

      sub.on('error', (err) => {
        // Important: don't crash the process — just log
        console.warn('[ioredis] error:', err && (err.message || err));
      });

      sub.subscribe('broadcast', (err, count) => {
        if (err) {
          console.warn('Redis subscribe error:', err && err.message);
        } else {
          console.log('Subscribed to Redis channel: broadcast (count=' + (count || 0) + ')');
        }
      });

      sub.on('message', (channel, message) => {
        if (channel !== 'broadcast') return;
        try {
          const payload = JSON.parse(message);
          if (global.io && typeof global.io.emit === 'function') {
            global.io.emit('broadcast', payload);
          } else if (global.wss && global.wss.clients) {
            global.wss.clients.forEach(c => {
              try { if (c.readyState === 1) c.send(JSON.stringify(payload)); } catch (_) {}
            });
          }
        } catch (e) {
          console.warn('Invalid broadcast message from Redis:', e && e.message);
        }
      });

      // close subscriber gracefully on shutdown
      process.on('SIGTERM', async () => {
        try { await sub.quit(); } catch (e) {}
      });
    } catch (e) {
      console.warn('Redis setup error:', e && (e.message || e));
    }
  }

  // Start server
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API Health: ${publicUrl()}/api/health`);
  });

  // If DB is connected at startup, start DB-dependent services now
  if (global.__DB_CONNECTED__) {
    try {
      startDbServices();
    } catch (e) {
      console.warn('Failed starting DB-dependent services:', e && (e.message || e));
    }
  }

  // React to mongoose connection lifecycle to start/stop services and update app.locals
  try {
    mongoose.connection.on('connected', () => {
      console.log('Mongoose event: connected');
      global.__DB_CONNECTED__ = true;
      try { app.locals.dbConnected = true; } catch (e) {}
      try { startDbServices(); } catch (e) { console.warn('Error starting DB services on connected:', e && e.message); }
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose event: disconnected');
      global.__DB_CONNECTED__ = false;
      try { app.locals.dbConnected = false; } catch (e) {}
      try { stopDbServices(); } catch (e) { console.warn('Error stopping DB services on disconnected:', e && e.message); }
    });
    mongoose.connection.on('error', (err) => {
      console.warn('Mongoose event: error', err && (err.message || err));
      // do not exit here; production connect attempt handled earlier (fail-fast)
    });
  } catch (e) {
    console.warn('Failed to attach mongoose lifecycle handlers:', e && e.message);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    try {
      stopDbServices();
      if (global.io && typeof global.io.close === 'function') global.io.close();
      if (global.wss && typeof global.wss.close === 'function') global.wss.close();
      server.close(() => {
        if (mongoose && mongoose.connection) {
          mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
      setTimeout(() => process.exit(1), 10000).unref();
    } catch (e) {
      console.error('Shutdown error', e && (e.message || e));
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Fatal startup error:', err && (err.stack || err.message || err));
  process.exit(1);
});