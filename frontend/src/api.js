// frontend/src/api.js
import axios from "axios";

/* ================================
   BASE CONFIG
================================ */

const BACKEND_HOST = (
  process.env.REACT_APP_BACKEND_BASE ||
  process.env.REACT_APP_API_BASE ||
  "https://aexon-qedx.onrender.com"
).replace(/\/+$/, "");

const API_BASE_URL = `${BACKEND_HOST}/api`;

/* ================================
   AXIOS INSTANCE
================================ */

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================================
   TOKEN
================================ */

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/* ================================
   REQUEST INTERCEPTOR
================================ */

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================================
   AUTH
================================ */

export function login(email, password) {
  return api.post("/auth/login", { email, password });
}

export function register(payload) {
  return api.post("/auth/register", payload);
}

export function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword(token, password) {
  return api.post("/auth/reset-password", { token, password });
}

/* ================================
   USER
================================ */

export function getMe() {
  return api.get("/user/me");
}

export function getWallet() {
  return api.get("/wallet");
}

export function getCoins() {
  return api.get("/coin");
}

export function getMyTrades() {
  return api.get("/trade/my");
}

/* ================================
   NEWS & ANNOUNCEMENTS
================================ */

export function getAnnouncements() {
  return api.get("/announcements");
}

export function getCryptoNews() {
  return api.get("/news");
}

/* ================================
   KYC
================================ */

export function submitKyc(formData) {
  if (formData instanceof FormData) {
    return axios.post(`${API_BASE_URL}/kyc`, formData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
  }
  return api.post("/kyc", formData);
}

/* ================================
   ADMIN
================================ */

export function adminGetSummary() {
  return api.get("/admin/summary");
}

export function adminGetUsers(search = "") {
  return api.get(`/admin/users?search=${encodeURIComponent(search)}`);
}

export function adminGetWallets(status = "pending") {
  return api.get(`/admin/wallets?status=${status}`);
}

export function adminGetTrades(search = "") {
  return api.get(`/admin/trades?search=${encodeURIComponent(search)}`);
}

export function adminGetSettings() {
  return api.get("/admin/settings");
}

export function adminGetLogs({ tail = false, limit = 500 } = {}) {
  return api.get(`/admin/logs?tail=${tail}&limit=${limit}`);
}

export function adminBanUser(userId) {
  return api.post(`/admin/user/${userId}/action`, { action: "ban" });
}

export function adminUnbanUser(userId) {
  return api.post(`/admin/user/${userId}/action`, { action: "unban" });
}

/**
 * Note: the backend endpoint for admin balance adjustments is:
 * POST /api/admin/user/:id/adjust-balance
 * (not /admin/user/:id/balance). Use this correct path.
 */
export function adminAdjustBalance({ userId, coin, delta, reason }) {
  return api.post(`/admin/user/${userId}/adjust-balance`, {
    coin,
    delta,
    reason,
  });
}

/**
 * Admin set deposit address helper (single coin/network)
 * Backend route: POST /api/admin/user/:id/deposit-address
 */
export function adminSetDepositAddress(userId, coin, network, address) {
  return api.post(`/admin/user/${userId}/deposit-address`, { coin, network, address });
}

/**
 * Admin price override helper
 * Backend route: POST /api/admin/price_override
 */
export function adminPriceOverride(symbol, price, broadcast = true) {
  return api.post("/admin/price_override", { symbol, price, broadcast });
}

/* ================================
   EXPORT DEFAULT
================================ */

export default api;