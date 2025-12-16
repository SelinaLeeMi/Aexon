// frontend/src/api.js
// Central API client and helper functions (frontend-only)
// Ensures Authorization header uses token stored under "token"

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

// Helper: get token from canonical storage location "token" (fall back to older keys if present)
function readAuthToken() {
  try {
    // Primary canonical key
    const t = localStorage.getItem("token");
    if (t) return t;
    // Backward compatibility fallbacks (do not prefer these; migrate to "token")
    const alt = localStorage.getItem("accessToken") || sessionStorage.getItem("token") || sessionStorage.getItem("accessToken");
    if (alt) {
      // normalize into canonical key for future reads
      try {
        localStorage.setItem("token", alt);
      } catch (e) {}
      return alt;
    }
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

// Admin helpers
export async function adminBanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "ban" });
}

export async function adminUnbanUser(userId) {
  if (!userId) throw new Error("userId required");
  return api.post(`/admin/user/${userId}/action`, { action: "unban" });
}

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

export default api;