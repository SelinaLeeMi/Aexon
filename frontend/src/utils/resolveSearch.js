/**
 * Pure search resolver
 *
 * Purpose:
 * - Centralize search interpretation in one place.
 * - Given a raw query string and a user object, return the route path the app should navigate to.
 *
 * Constraints:
 * - Pure function: no side effects, no React, no hooks, no localStorage access.
 * - Input: (query: string, user: object)
 * - Output: { path: string }
 *
 * Behavior:
 * - Empty/whitespace query -> { path: "/market" }
 * - Admin-keyword queries -> { path: "/super-0xA35-panel" } but only if user?.role === "admin"
 *   otherwise fall back to market search
 * - All other queries -> { path: `/market?q=${encodeURIComponent(query)}` }
 */

const ADMIN_KEYWORDS = [
  "admin",
  "users",
  "withdrawals",
  "admin panel",
  "manage users"
];

const ADMIN_LANDING = "/super-0xA35-panel";
const MARKET_BASE = "/market";

function normalize(q) {
  if (typeof q !== "string") return "";
  return q.trim();
}

/**
 * Determine whether the query matches an admin keyword.
 * Matching is case-insensitive and checks for substring presence.
 * (This keeps the resolver simple and robust; more advanced matching can be added later.)
 *
 * @param {string} qLower - normalized lower-case query
 * @returns {boolean}
 */
function isAdminKeyword(qLower) {
  if (!qLower) return false;
  return ADMIN_KEYWORDS.some(keyword => qLower.includes(keyword));
}

/**
 * resolveSearch - pure resolver
 *
 * @param {string} query - raw user query
 * @param {object} user  - parsed user object (may be {} or undefined). Must not be read from localStorage here.
 * @returns {{ path: string }}
 */
export function resolveSearch(query, user) {
  const q = normalize(query);
  const qLower = q.toLowerCase();

  if (!q) {
    // Empty query => go to market overview
    return { path: MARKET_BASE };
  }

  // Admin keywords: only allow if user.role === 'admin'
  if (isAdminKeyword(qLower)) {
    if (user && user.role === "admin") {
      return { path: ADMIN_LANDING };
    }
    // Non-admin users fall back to market search for safety
    return { path: `${MARKET_BASE}?q=${encodeURIComponent(q)}` };
  }

  // Default behavior: search the market (coins/pages)
  return { path: `${MARKET_BASE}?q=${encodeURIComponent(q)}` };
}

export default resolveSearch;