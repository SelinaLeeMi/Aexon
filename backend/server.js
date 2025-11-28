/**
 * backend/server.js — Full Modern Entrypoint (2025)
 * - Loads main app from app.js
 * - Handles WS, Socket.IO, Redis broadcast, static files
 * - Robust error/logging/shutdown handlers
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const REQ_LOG = String(process.env.REQ_LOG || 'false').toLowerCase() === 'true';

async function main() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("MongoDB connected.");
    } catch (err) {
      console.error("MongoDB connection error:", err && (err.message || err));
    }
  } else {
    console.warn("MONGODB_URI not set. Some features will not work.");
  }

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
    });
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
      ws.send(JSON.stringify({ type: 'connected', ts: Date.now() }));
    });
    console.log('Native WebSocket attached @ /ws (global.wss)');
  } catch (e) {
    console.warn('ws not available:', e && (e.message || e));
  }

  // Redis PUB/SUB subscriber for broadcast channel
  if (process.env.REDIS_URL) {
    try {
      const IORedis = require('ioredis');
      const sub = new IORedis(process.env.REDIS_URL);
      sub.subscribe('broadcast', (err) => {
        if (err) console.warn('Redis subscribe error:', err && err.message);
        else console.log('Subscribed to Redis channel: broadcast');
      });
      sub.on('message', (channel, message) => {
        if (channel === 'broadcast') {
          try {
            const payload = JSON.parse(message);
            if (global.io && typeof global.io.emit === 'function') {
              global.io.emit('broadcast', payload);
            } else if (global.wss && global.wss.clients) {
              global.wss.clients.forEach(c => {
                try { if (c.readyState === 1) c.send(JSON.stringify(payload)); } catch {}
              });
            }
          } catch (e) {
            console.warn('Invalid broadcast message from Redis:', e && e.message);
          }
        }
      });
    } catch (e) {
      console.warn('Redis setup error:', e && (e.message || e));
    }
  }

  // Main listen
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });

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