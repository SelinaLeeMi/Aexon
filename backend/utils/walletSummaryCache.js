/**
 * walletSummaryCache.js
 *
 * Minimal in-memory cache for wallet summaries.
 * - Keyed by userId (string)
 * - TTL (ms) configurable; default 8 seconds
 *
 * NOTE: This is intentionally simple and in-memory to be minimal and safe.
 * If you run multiple backend nodes, you may replace with Redis for cross-node invalidation.
 */

const DEFAULT_TTL_MS = 8000; // 8 seconds (tunable)

class WalletSummaryCache {
  constructor() {
    this.map = new Map(); // userId -> { ts, data }
    this.ttl = DEFAULT_TTL_MS;
  }

  _isFresh(entry) {
    if (!entry) return false;
    return (Date.now() - entry.ts) < this.ttl;
  }

  get(userId) {
    const entry = this.map.get(String(userId));
    if (this._isFresh(entry)) return entry.data;
    // stale or missing
    this.map.delete(String(userId));
    return null;
  }

  set(userId, data) {
    this.map.set(String(userId), { ts: Date.now(), data });
  }

  invalidate(userId) {
    this.map.delete(String(userId));
  }

  clearAll() {
    this.map.clear();
  }

  setTTL(ms) {
    this.ttl = Number(ms) || this.ttl;
  }
}

// Export singleton
module.exports = new WalletSummaryCache();