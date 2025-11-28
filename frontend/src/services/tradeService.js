/**
 * Trade service wrappers
 *
 * - Uses the existing api axios instance (with auth interceptors).
 * - Exposes functions: placeTrade, getMyTrades, openFutures, closeFutures, getFuturesPositions
 *
 * All functions return the backend result (data object) or throw an error string.
 */
import api from "../api";

export async function placeTrade({ type, coinSymbol, amount, price }) {
  try {
    const res = await api.post("/trade/place", {
      type,
      coinSymbol,
      amount,
      price
    });
    return res.data;
  } catch (err) {
    throw (typeof err === "string") ? err : (err?.response?.data?.error || err?.message || "Trade failed");
  }
}

export async function getMyTrades() {
  try {
    const res = await api.get("/trade/my");
    return res.data;
  } catch (err) {
    throw (typeof err === "string") ? err : (err?.response?.data?.error || err?.message || "Failed to fetch trades");
  }
}

// Futures
export async function openFuturesPosition(payload) {
  try {
    const res = await api.post("/futures/futures/open", payload);
    return res.data;
  } catch (err) {
    throw (typeof err === "string") ? err : (err?.response?.data?.error || err?.message || "Failed to open position");
  }
}

export async function closeFuturesPosition(payload) {
  try {
    const res = await api.post("/futures/futures/close", payload);
    return res.data;
  } catch (err) {
    throw (typeof err === "string") ? err : (err?.response?.data?.error || err?.message || "Failed to close position");
  }
}

export async function listMyFuturesPositions() {
  try {
    const res = await api.get("/futures/futures/my-positions");
    return res.data;
  } catch (err) {
    throw (typeof err === "string") ? err : (err?.response?.data?.error || err?.message || "Failed to fetch positions");
  }
}