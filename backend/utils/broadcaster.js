/**
 * broadcaster.js
 *
 * Lightweight broadcast helper:
 * - Emits via global.io (Socket.IO) or global.wss (native ws).
 * - If REDIS_URL present, publishes to 'broadcast' channel (ioredis).
 * - Always returns boolean success indicator.
 *
 * Also exports a local EventEmitter for in-process listening.
 */
const { EventEmitter } = require('events');
let redisClient = null;
let pub = null;
const emitter = new EventEmitter();

async function maybeSetupRedis() {
  try {
    if (process.env.REDIS_URL && !redisClient) {
      const IORedis = require('ioredis');
      redisClient = new IORedis(process.env.REDIS_URL);
      pub = redisClient;
      redisClient.on('error', (e) => console.warn('Redis error (broadcaster):', e.message || e));
    }
  } catch (e) {
    // ignore
  }
}

maybeSetupRedis();

function broadcast(payload) {
  try {
    // Socket.IO
    if (global.io && typeof global.io.emit === "function") {
      global.io.emit("broadcast", payload);
      return true;
    }
    // native ws server
    if (global.wss && global.wss.clients) {
      global.wss.clients.forEach(client => {
        try {
          if (client.readyState === 1) client.send(JSON.stringify(payload));
        } catch (e) { /* ignore */ }
      });
      return true;
    }
    // Redis publish
    if (pub && typeof pub.publish === "function") {
      pub.publish("broadcast", JSON.stringify(payload));
      return true;
    }
    // in-process
    emitter.emit("broadcast", payload);
    return true;
  } catch (e) {
    console.warn("broadcast failed", e && (e.message || e));
    return false;
  }
}

function broadcastToRoom(room, payload) {
  try {
    if (global.io && typeof global.io.to === "function") {
      global.io.to(room).emit("broadcast", payload);
      return true;
    }
    return broadcast(payload);
  } catch (e) {
    console.warn("broadcastToRoom failed", e && (e.message || e));
    return false;
  }
}

module.exports = {
  broadcast,
  broadcastToRoom,
  emitter
};