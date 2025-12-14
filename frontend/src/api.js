// frontend/src/api.js
// Central API client and helper functions
// - Exports default axios instance (api)
// - Exports helper functions used throughout the frontend.
// - Ensures Authorization header is attached from localStorage/sessionStorage
// - IMPORTANT: baseURL does NOT include "/api"; helper functions prefix "/api" on request paths
import axios from "axios";

const RAW_API_BASE = (process.env.REACT_APP_API_BASE || "https://aexon-qedx.onrender.com").replace(/\/+$/, "");
// Keep baseURL as the raw host (do NOT append "/api" here)
const api = axios.create({
  baseURL: RAW_API_BASE,
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

// attach token automatically to API requests
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
        // Remove only auth-related keys to avoid wiping unrelated app state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        if (typeof onForceLogout === "function") onForceLogout(msg);
      } catch (e) {}
    }
    return Promise.reject(err);
  }
);

// --- Helper endpoints used across the frontend ---
// Note: these return axios promises; existing .then/.catch code continues to work

// All helper functions target the backend under the "/api" prefix explicitly.
// This keeps SPA routes and static assets at the host root unaffected.

// Public / API calls
export function getCoins() {
  return api.get("/api/coin");
}

export function getMe() {
  return api.get("/api/user/me");
}

export function getWallet() {
  return api.get("/api/wallet");
}

export function getAnnouncements() {
  return api.get("/api/announcements");
}

export function getCryptoNews() {
  return api.get("/api/news");
}

export function forgotPassword(email) {
  return api.post("/api/auth/forgot-password", { email });
}

export function resetPassword(token, password) {
  return api.post("/api/auth/reset-password", { token, password });
}

// submit KYC (FormData or JSON)
// Use the raw axios instance for FormData so browser sets the multipart Content-Type.
// For JSON we use the shared api instance which already sets headers and Authorization.
export function submitKyc(formData) {
  if (formData instanceof FormData) {
    // Use full absolute URL to avoid the api instance's JSON header interfering with multipart
    const url = `${RAW_API_BASE}/api/kyc`;
    return axios.post(url, formData, {
      headers: { Authorization: `Bearer ${readAuthToken() || ""}` },
    });
  }
  return api.post("/api/kyc", formData);
}

export function getMyTrades() {
  return api.get("/api/trade/my");
}

// Auth convenience helpers (these hit /api/auth/*)
export function login(email, password) {
  return api.post("/api/auth/login", { email, password });
}

export function register(payload) {
  return api.post("/api/auth/register", payload);
}

// --- Admin helper functions (minimal, safe) ---
// These wrap existing /api/admin endpoints and rely on the axios instance so Authorization header is automatic.

// Ban a user
export async function adminBanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/api/admin/user/${userId}/action`, { action: "ban" });
}

// Unban a user
export async function adminUnbanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/api/admin/user/${userId}/action`, { action: "unban" });
}

// Set deposit address(es) for a user.
// Supports two forms:
//  - Single: adminSetDepositAddress({ userId, coin: "USDT", address: "addr123" })
//  - Multiple: adminSetDepositAddress({ userId, address: { USDT: "addr1", BTC: "addr2" } })
export async function adminSetDepositAddress({ userId, coin, address }) {
  if (!userId) throw new Error("userId required");

  // If address is an object, treat as multiple coin->address mapping
  if (address && typeof address === "object" && !coin) {
    const entries = Object.entries(address).filter(([k, v]) => !!k && !!v);
    if (entries.length === 0) return Promise.resolve({ success: true });
    const results = [];
    for (const [c, addr] of entries) {
      try {
        const r = await api.post(`/api/admin/user/${userId}/deposit-address`, { coin: c, address: String(addr) });
        results.push({ coin: c, ok: true, resp: r.data });
      } catch (e) {
        results.push({ coin: c, ok: false, error: e?.response?.data || e?.message || String(e) });
      }
    }
    return results;
  }

  // Single mapping
  if (!coin || !address) throw new Error("coin and address required for single update");
  return api.post(`/api/admin/user/${userId}/deposit-address`, { coin: String(coin).toUpperCase(), address: String(address) });
}

// Default export: axios instance (host base w/out forced /api)
export default api;