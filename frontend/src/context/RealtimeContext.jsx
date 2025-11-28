/**
 * RealtimeContext
 *
 * - Wrap your app with <RealtimeProvider> to provide:
 *   { prices, balances, trades, sendWs, wsStatus }
 *
 * - Internally uses useWebSocket, subscribes to price_update, balance_update,
 *   trade_executed messages and updates context state.
 *
 * - If WebSocket is unavailable, falls back to polling coin data every 5s.
 *
 * Note: Add <RealtimeProvider> near the top of your app (e.g., in App.jsx) so pages can consume realtime updates.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";
import api from "../api";

const RealtimeContext = createContext();

export function RealtimeProvider({ children, enabled = true, pollInterval = 5000 }) {
  const [prices, setPrices] = useState({}); // { SYMBOL: { price, change, ... } }
  const [balances, setBalances] = useState({}); // mapped by coin symbol
  const [trades, setTrades] = useState([]); // recent trades
  const [wsStatus, setWsStatus] = useState("idle");

  // message handler
  const handleMessage = (msg) => {
    if (!msg) return;
    const t = msg.type || (msg?.payload?.type) || "unknown";
    switch (t) {
      case "price_update":
      case "prices":
      case "coin_prices":
        {
          const payload = msg.payload || msg;
          // accept either array or object
          if (Array.isArray(payload)) {
            const next = {};
            payload.forEach(c => {
              const sym = (c.symbol || c?.id || "").toUpperCase();
              next[sym] = { ...c };
            });
            setPrices(prev => ({ ...prev, ...next }));
          } else if (typeof payload === "object") {
            // payload: { BTC: {...}, ETH: {...} } or single coin
            if (payload.symbol) {
              const sym = payload.symbol.toUpperCase();
              setPrices(prev => ({ ...prev, [sym]: payload }));
            } else {
              // object map
              setPrices(prev => ({ ...prev, ...payload }));
            }
          }
        }
        break;
      case "balance_update":
        {
          const p = msg.payload || {};
          // p: { coin: 'BTC', balance: 1.2 } or array
          if (Array.isArray(p)) {
            const map = {};
            p.forEach(w => map[(w.coin || "").toUpperCase()] = w);
            setBalances(prev => ({ ...prev, ...map }));
          } else if (p.coin) {
            setBalances(prev => ({ ...prev, [(p.coin || "").toUpperCase()]: p }));
          }
        }
        break;
      case "trade_executed":
        {
          const tPayload = msg.payload;
          if (tPayload) {
            setTrades(prev => [tPayload, ...prev].slice(0, 200));
          }
        }
        break;
      case "poll_prices":
        {
          const payload = msg.payload || [];
          // payload from /api/coin
          if (Array.isArray(payload)) {
            const next = {};
            payload.forEach(c => next[(c.symbol||"").toUpperCase()] = c);
            setPrices(prev => ({ ...prev, ...next }));
          }
        }
        break;
      default:
        // ignore unknown types
        break;
    }
  };

  const ws = useWebSocket({
    path: "/ws",
    enabled,
    pollInterval,
    onMessage: handleMessage,
    onOpen: () => setWsStatus("open"),
    onClose: () => setWsStatus("closed"),
    onError: () => setWsStatus("error")
  });

  // initial fetch to seed prices & balances
  useEffect(() => {
    let mounted = true;
    async function seed() {
      try {
        const [coinsRes, walletRes] = await Promise.allSettled([api.get("/coin"), api.get("/wallet")]);
        if (!mounted) return;
        if (coinsRes.status === "fulfilled") {
          const data = coinsRes.value.data?.data ?? coinsRes.value.data;
          if (Array.isArray(data)) {
            const map = {};
            data.forEach(c => map[(c.symbol||"").toUpperCase()] = c);
            setPrices(prev => ({ ...prev, ...map }));
          }
        }
        if (walletRes.status === "fulfilled") {
          const w = walletRes.value.data?.data ?? walletRes.value.data;
          if (Array.isArray(w)) {
            const map = {};
            w.forEach(x => map[(x.coin||"").toUpperCase()] = x);
            setBalances(map);
          }
        }
      } catch (e) {
        // ignore seed errors
      }
    }
    seed();
    return () => { mounted = false; };
  }, []);

  const sendWs = (obj) => ws.send(obj);

  const value = useMemo(() => ({
    prices,
    balances,
    trades,
    wsStatus,
    sendWs,
    reconnect: ws.reconnect
  }), [prices, balances, trades, wsStatus, sendWs, ws]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}