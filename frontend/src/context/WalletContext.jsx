import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const WalletContext = createContext(null);

// Provider component. Mount this once at top-level (e.g., in App.jsx).
export function WalletProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(false);

  // fetch once on mount (or on login). This avoids fetching per page.
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/wallet/summary', { credentials: 'include' });
      if (!resp.ok) throw new Error('Failed to fetch wallet summary');
      const json = await resp.json();
      if (json && json.success) setSummary(json.data);
    } catch (err) {
      console.warn('wallet summary fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchSummary();
    }
    // you can add code here to re-fetch after login or token refresh
  }, []);

  // Optional: websocket integration (update summary when server broadcasts)
  useEffect(() => {
    if (!window.socketIOClient) return; // adapt to your socket initialization
    const socket = window.socketIOClient;
    const walletUpdateHandler = (payload) => {
      // simple strategy: refresh summary when wallet_update or price_update arrives
      // for better perf, you can patch summary incrementally
      fetchSummary();
    };
    socket.on('wallet_update', walletUpdateHandler);
    socket.on('price_update', walletUpdateHandler);
    return () => {
      socket.off('wallet_update', walletUpdateHandler);
      socket.off('price_update', walletUpdateHandler);
    };
  }, []);

  const value = {
    summary,
    loading,
    refresh: fetchSummary
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// Hook to use wallet context
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return ctx;
}