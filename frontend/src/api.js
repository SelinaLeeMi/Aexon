// frontend/src/api.js
// Central API client and helper functions (frontend-only)
//
// Purpose:
// - Ensure ALL API requests target the backend origin using a FULL absolute base URL.
// - Keep Authorization: Bearer <token> attached automatically.
// - Minimal, safe changes only to this file to satisfy static-site constraints (no proxy/rewrite).
//
// Behavior:
// - Reads backend origin from REACT_APP_BACKEND_BASE (preferred) or REACT_APP_API_BASE fallback.
// - Constructs an absolute baseURL that includes the "/api" prefix (e.g. https://backend.onrender.com/api).
// - Uses axios instance with that baseURL so calls like api.get("/admin/summary") resolve to
//   https://backend.onrender.com/api/admin/summary.
// - submitKyc(FormData) uses raw axios.post to the full absolute URL so multipart boundaries are handled by the browser.

import axios from "axios";

// Backend host/origin (absolute) - prefer explicit env var REACT_APP_BACKEND_BASE
const BACKEND_HOST = (process.env.REACT_APP_BACKEND_BASE || process.env.REACT_APP_API_BASE || "https://aexon-qedx.onrender.com").replace(/\/+$/, "");

// Full API base (absolute) — includes /api path. This ensures the static frontend calls the backend origin directly.
const API_BASE_URL = `${BACKEND_HOST}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Attach token automatically to all requests to the backend API
api.interceptors.request.use((config) => {
  try {
    const token = readAuthToken();
    if (token) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    // Note: config.url will be appended to API_BASE_URL by axios; callers should use relative paths like "/admin/summary" or "/coin".
  } catch (e) {
    // swallow errors so requests still go out
  }
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

// --------------------
// Public / API helpers
// --------------------
// Note: Because baseURL includes the absolute backend origin + "/api", callers throughout the app
// can call api.get("/me") or api.get("/admin/summary") and requests will hit the correct backend URL.

export function getCoins() {
  return api.get("/coin");
}

export function getMe() {
  return api.get("/user/me");
}

export function getWallet() {
  return api.get("/wallet");
}

export function getAnnouncements() {
  return api.get("/announcements");
}

export function getCryptoNews() {
  return api.get("/news");
}

export function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword(token, password) {
  return api.post("/auth/reset-password", { token, password });
}

// submit KYC (FormData or JSON)
// Use raw axios for FormData so the browser sets multipart boundaries correctly.
// Build absolute URL using BACKEND_HOST to avoid any baseURL confusion.
export function submitKyc(formData) {
  if (formData instanceof FormData) {
    const url = `${BACKEND_HOST}/api/kyc`;
    return axios.post(url, formData, {
      headers: { Authorization: `Bearer ${readAuthToken() || ""}` },
    });
  }
  return api.post("/kyc", formData);
}

export function getMyTrades() {
  return api.get("/trade/my");
}

// Auth convenience helpers (these hit /api/auth/*)
export function login(email, password) {
  return api.post("/auth/login", { email, password });
}

export function register(payload) {
  return api.post("/auth/register", payload);
}

// --------------------
// Admin helper functions (minimal, safe)
// --------------------

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
// Supports:
//  - Single: adminSetDepositAddress({ userId, coin: "USDT", address: "addr123" })
//  - Multiple: adminSetDepositAddress({ userId, address: { USDT: "addr1", BTC: "addr2" } })
export async function adminSetDepositAddress({ userId, coin, address }) {
  if (!userId) throw new Error("userId required");

  if (address && typeof address === "object" && !coin) {
    const entries = Object.entries(address).filter(([k, v]) => !!k && !!v);
    if (entries.length === 0) return Promise.resolve({ success: true });
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

  if (!coin || !address) throw new Error("coin and address required for single update");
  return api.post(`/admin/user/${userId}/deposit-address`, { coin: String(coin).toUpperCase(), address: String(address) });
}

// Default export: configured axios instance (absolute backend API base)
export default api;