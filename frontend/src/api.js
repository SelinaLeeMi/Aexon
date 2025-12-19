// frontend/src/api.js
// Central API client for Aexon
// FIXED: Always attach Authorization header from localStorage("token")

import axios from "axios";

/* ================================
   BASE CONFIG
================================ */

// Backend base (Render)
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
   TOKEN HANDLING
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
   → THIS IS THE CRITICAL FIX
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
   RESPONSE INTERCEPTOR
================================ */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT auto-logout unless explicitly unauthorized
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      console.warn("Auth error:", error?.response?.data);
    }

    return Promise.reject(error);
  }
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

export function adminAdjustBalance({ userId, coin, delta, reason }) {
  return api.post(`/admin/user/${userId}/balance`, {
    coin,
    delta,
    reason,
  });
}

/* ================================
   EXPORT
================================ */

export default api;

