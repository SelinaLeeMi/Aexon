// frontend/src/api.js
// Central API client and helper functions
// - Exports default axios instance (api)
// - Exports helper functions used throughout the frontend.
// - Adds small admin helpers (adminBanUser, adminUnbanUser, adminSetDepositAddress)
// - Ensures Authorization header is attached from localStorage/sessionStorage

import axios from "axios";

const RAW_API_BASE = process.env.REACT_APP_API_BASE || "https://aexon-qedx.onrender.com";
// Ensure default base includes /api so calls like api.get('/admin/summary') hit /api/admin/summary
const API_BASE = RAW_API_BASE.replace(/\/+$/, "") + "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// logout handler hook
let onForceLogout = () => {};
export function setForceLogoutHandler(fn) {
  onForceLogout = fn;
}

// Helper: get token from canonical storage locations
function readAuthToken() {
  try {
    // Primary: localStorage
    const t = localStorage.getItem("token");
    if (t) return t;
    // Fallback: sessionStorage
    const s = sessionStorage.getItem("token");
    if (s) return s;
  } catch (e) {
    // ignore storage errors (e.g., privacy mode)
  }
  return null;
}

// attach token automatically
api.interceptors.request.use((config) => {
  try {
    const token = readAuthToken();
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  } catch (e) {}
  return config;
});

// central error handling (force logout for auth issues)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "";
    if (
      status === 401 ||
      status === 403 ||
      (typeof msg === "string" && (msg.toLowerCase().includes("jwt") || msg.toLowerCase().includes("not authorized") || msg.toLowerCase().includes("banned")))
    ) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (typeof onForceLogout === "function") onForceLogout(msg);
      } catch (e) {}
      // optional redirect for SPA; swallowing here so callers can handle too
    }
    return Promise.reject(err);
  }
);

// --- Helper endpoints used across the frontend ---
// Note: these return axios promises; existing .then/.catch code continues to work

export function getCoins() {
  // Primary: /coin (used across frontend)
  return api.get("/coin");
}

export function getMe() {
  // Common user info endpoints - try canonical path
  return api.get("/user/me");
}

export function getWallet() {
  // User wallet summary
  return api.get("/wallet");
}

export function getAnnouncements() {
  // Announcements endpoint
  return api.get("/announcements");
}

export function getCryptoNews() {
  // Crypto news endpoint
  return api.get("/news");
}

export function forgotPassword(email) {
  // Try common forgot-password endpoints
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword(token, password) {
  return api.post("/auth/reset-password", { token, password });
}

export function submitKyc(formData) {
  // submit KYC; formData can be FormData or object
  // If it's FormData, axios will set appropriate headers automatically
  if (formData instanceof FormData) {
    // For FormData we need a separate request (no JSON header)
    return axios.post(`${API_BASE.replace(/\/api\/?$/, "")}/api/kyc`, formData, {
      headers: { Authorization: `Bearer ${readAuthToken() || ""}` },
    });
  }
  return api.post("/kyc", formData);
}

export function getMyTrades() {
  return api.get("/trade/my");
}

// Auth convenience helpers
export function login(email, password) {
  return api.post("/auth/login", { email, password });
}

export function register(payload) {
  return api.post("/auth/register", payload);
}

// --- Admin helper functions (minimal, safe) ---
// These wrap existing /admin endpoints and rely on the axios instance so Authorization header is automatic.

// Ban a user
export async function adminBanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "ban" });
}

// Unban a user
export async function adminUnbanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "unban" });
}

// Set deposit address(es) for a user.
// Supports two forms:
//  - Single: adminSetDepositAddress({ userId, coin: "USDT", address: "addr123" })
//  - Multiple: adminSetDepositAddress({ userId, address: { USDT: "addr1", BTC: "addr2" } })
// When multiple addresses are provided, this issues one request per coin (auditable, minimal).
export async function adminSetDepositAddress({ userId, coin, address }) {
  if (!userId) throw new Error("userId required");

  // If address is an object, treat as multiple coin->address mapping
  if (address && typeof address === "object" && !coin) {
    const entries = Object.entries(address).filter(([k, v]) => !!k && !!v);
    if (entries.length === 0) return Promise.resolve({ success: true });
    // perform requests serially to avoid overwhelming backend and to keep audit sequence
    const results = [];
    for (const [c, addr] of entries) {
      try {
        const r = await api.post(`/admin/user/${userId}/deposit-address`, { coin: c, address: String(addr) });
        results.push({ coin: c, ok: true, resp: r.data });
      } catch (e) {
        results.push({ coin: c, ok: false, error: e?.response?.data || e?.message || String(e) });
      }
    }
    return results;
  }

  // Single mapping
  if (!coin || !address) throw new Error("coin and address required for single update");
  return api.post(`/admin/user/${userId}/deposit-address`, { coin: String(coin).toUpperCase(), address: String(address) });
}

// Export default axios instance
export default api;