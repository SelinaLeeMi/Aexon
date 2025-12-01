// Central API client and helper functions
// - Exports default axios instance (api)
// - Exports helper functions used throughout the frontend: getCoins, getMe, getWallet, getAnnouncements, getCryptoNews, forgotPassword, submitKyc, login, register, etc.
// - Keeps the existing setForceLogoutHandler behavior.

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "https://aexon-qedx.onrender.com";
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

// attach token automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
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

export default api;