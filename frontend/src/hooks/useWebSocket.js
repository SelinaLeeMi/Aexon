/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Reconnecting WebSocket hook with optional polling fallback.
 *
 * - Connects to REACT_APP_WS_URL or derives from REACT_APP_API_BASE.
 * - Automatic reconnect with exponential backoff.
 * - Emits parsed JSON messages with { type, payload } format.
 * - If WebSocket fails or is disabled, falls back to efficient polling (configurable).
 *
 * Usage:
 *   const { send, status, lastMessage } = useWebSocket();
 */
import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api";

const DEFAULT_POLL_INTERVAL = 5000; // 5s when falling back

export default function useWebSocket({
  path = "/ws",
  enabled = true,
  pollInterval = DEFAULT_POLL_INTERVAL,
  onMessage = () => {},
  onOpen = () => {},
  onClose = () => {},
  onError = () => {}
} = {}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timer: null });
  const pollingRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle, connecting, open, closed, error, fallback
  const lastMessageRef = useRef(null);

  const buildWsUrl = () => {
    const envWs = process.env.REACT_APP_WS_URL;
    if (envWs) return envWs;
    const apiBase = process.env.REACT_APP_API_BASE || window.location.origin;
    try {
      const u = new URL(apiBase);
      u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
      u.pathname = path;
      return u.toString();
    } catch {
      // fallback: try same host with ws path
      const origin = window.location.origin.replace(/^http/, "ws");
      return `${origin}${path}`;
    }
  };

  const clearReconnect = () => {
    if (reconnectRef.current.timer) {
      clearTimeout(reconnectRef.current.timer);
      reconnectRef.current.timer = null;
    }
  };

  const startPolling = useCallback(async () => {
    if (pollingRef.current) return;
    setStatus("fallback");
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/coin");
        const payload = res?.data?.data ?? res?.data;
        const msg = { type: "poll_prices", payload, timestamp: Date.now() };
        lastMessageRef.current = msg;
        onMessage(msg);
      } catch (err) {
        // ignore polling errors
      }
    }, pollInterval);
    // run initial poll immediately
    try {
      const res = await api.get("/coin");
      const payload = res?.data?.data ?? res?.data;
      const msg = { type: "poll_prices", payload, timestamp: Date.now() };
      lastMessageRef.current = msg;
      onMessage(msg);
    } catch {}
  }, [onMessage, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const send = useCallback((object) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(object));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) {
      startPolling();
      return;
    }
    clearReconnect();
    stopPolling();
    setStatus("connecting");
    const url = buildWsUrl();
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (ev) => {
        reconnectRef.current.attempts = 0;
        setStatus("open");
        onOpen(ev);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          lastMessageRef.current = data;
          onMessage(data);
        } catch (e) {
          lastMessageRef.current = evt.data;
          onMessage({ type: "raw", payload: evt.data });
        }
      };

      ws.onerror = (err) => {
        setStatus("error");
        onError(err);
      };

      ws.onclose = (ev) => {
        setStatus("closed");
        onClose(ev);
        // schedule reconnect
        reconnectRef.current.attempts++;
        const attempt = reconnectRef.current.attempts;
        const delay = Math.min(30000, 500 * Math.pow(1.8, attempt)); // exponential backoff up to 30s
        reconnectRef.current.timer = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (e) {
      setStatus("error");
      startPolling();
    }
  }, [enabled, onMessage, onOpen, onClose, onError, startPolling, stopPolling]);

  useEffect(() => {
    connect();
    return () => {
      clearReconnect();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
      stopPolling();
    };
    // eslint-disable-next-line
  }, [enabled]);

  return {
    status,
    send,
    lastMessage: lastMessageRef.current,
    startPolling,
    stopPolling,
    reconnect: () => {
      clearReconnect();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
      connect();
    }
  };
}