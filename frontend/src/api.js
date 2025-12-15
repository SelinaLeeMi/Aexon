// frontend/src/api.js
// Central API client and helper functions (frontend-only)
//
// Purpose:
// - Ensure ALL API requests target the backend origin using a FULL absolute base URL.
// - Keep Authorization: Bearer <token> attached automatically.
// - Minimal, safe changes only to this file to align frontend endpoint paths with backend routes.

import axios from "axios";

// Backend host/origin (absolute) - prefer explicit env var REACT_APP_BACKEND_BASE
const BACKEND_HOST = (process.env.REACT_APP_BACKEND_BASE || process.env.REACT_APP_API_BASE || "https://aexon-qedx.onrender.com").replace(/\/+$/, "");

// Full API base (absolute) — includes /api path.
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
    const t = localStorage.getItem("token");
    if (t) return t;
    const s = sessionStorage.getItem("token");
    if (s) return s;
  } catch (e) {}
  return null;
}

// Attach token automatically to all requests to the backend API
api.interceptors.request.use((config) => {
  try {
    const token = readAuthToken();
    if (token) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    // callers use relative paths like "/user/me" or "/admin/summary"; axios will resolve against API_BASE_URL
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
// Corrected endpoint paths here to exactly match backend routes:
// - GET /api/user/me  (important fix)
// - GET /api/wallet
// - GET /api/coin
// - POST /api/auth/login
// - POST /api/auth/register

export function getCoins() {
  // Backend: GET /api/coin
  return api.get("/coin");
}

export function getMe() {
  // Backend: GET /api/user/me  (use the user router's "me" endpoint)
  return api.get("/user/me");
}

export function getWallet() {
  // Backend: GET /api/wallet
  return api.get("/wallet");
}

export function getAnnouncements() {
  // Backend: GET /api/announcements
  return api.get("/announcements");
}

export function getCryptoNews() {
  // Backend: GET /api/news
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

export async function adminBanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "ban" });
}

export async function adminUnbanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "unban" });
}

// Set deposit address(es) for a user.
// Supports two forms: single coin or an object mapping of coin->address.
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