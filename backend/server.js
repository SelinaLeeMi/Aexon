/**
 * backend/server.js — Full Modern Entrypoint (2025)
 * - Loads main app from app.js
 * - Handles WS, Socket.IO, Redis broadcast, static files
 * - Robust error/logging/shutdown handlers
 * - Starts price engine if available
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

async function main() {
  // Connect to MongoDB (if provided)
  if (MONGODB_URI) {
    try {
      // Mongoose v7 doesn't require these options but harmless to keep
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("MongoDB connected.");
    } catch (err) {
      console.error("MongoDB connection error:", err && (err.message || err));
    }
  } else {
    console.warn("MONGODB_URI not set. Some features will not work.");
  }

  // Load express app (app.js should export the Express app)
  const app = require('./app');

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

  // Start price engine if available (non-blocking)
  try {
    // price engine should export a start function; this file is optional
    const startPriceEngine = require('./jobs/priceUpdater');
    if (typeof startPriceEngine === 'function') {
      startPriceEngine();
      console.log('Price engine started (from jobs/priceUpdater).');
    }
  } catch (e) {
    console.log('Price engine not found or failed to start (jobs/priceUpdater).', e && (e.message || e));
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    try {
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
