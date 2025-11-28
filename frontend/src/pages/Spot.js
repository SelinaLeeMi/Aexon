import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Paper, Select, MenuItem, TextField, Button, Alert, Grid, CircularProgress } from "@mui/material";
import BottomNav from "../components/BottomNav";
import { useRealtime } from "../context/RealtimeContext";
import { placeTrade } from "../services/tradeService";
import api from "../api";
import { useNotification } from "../components/NotificationProvider";

/**
 * Spot Trading (backend-backed)
 * - Replaces the previous local simulation with backend placeTrade.
 * - Uses RealtimeContext for live prices but sends the request to backend for execution.
 * - Refreshes wallet and notifies user on success/failure.
 */
export default function Spot() {
  const realtime = useRealtime();
  const notify = useNotification();
  const [coins, setCoins] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [type, setType] = useState("buy");
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/coin")
      .then(res => {
        const arr = res.data?.data || res.data || [];
        if (!mounted) return;
        setCoins(Array.isArray(arr) ? arr : []);
        if (Array.isArray(arr) && arr.length && !coin) setCoin(arr[0].symbol);
      })
      .catch(() => {
        if (!mounted) return;
        setCoins([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    api.get("/wallet")
      .then(res => {
        const w = res.data?.data || res.data || [];
        if (!mounted) return;
        setWallet(Array.isArray(w) ? w : []);
      })
      .catch(() => { if (!mounted) setWallet([]); });

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // price map merges backend coin list + realtime overrides
  const priceMap = useMemo(() => {
    const map = {};
    coins.forEach(c => (map[c.symbol] = Number(c.price ?? c.current_price ?? 0)));
    if (realtime?.prices) {
      Object.entries(realtime.prices).forEach(([sym, val]) => {
        if (!sym) return;
        const s = sym.toUpperCase();
        const p = Number(val?.price ?? val?.current_price ?? val ?? 0);
        if (p) map[s] = p;
      });
    }
    return map;
  }, [coins, realtime?.prices]);

  const handlePlaceTrade = async () => {
    setErrorMsg("");
    if (!coin || !amount || Number(amount) <= 0) {
      setErrorMsg("Please select a coin and enter a positive amount.");
      return;
    }
    const price = priceMap[coin] || 0;
    setPlacing(true);
    try {
      await placeTrade({
        type,
        coinSymbol: coin,
        amount: Number(amount),
        price
      });
      notify.showNotification("Trade executed (backend). Refreshing balances...", "success", 4000);
      // refresh wallet and optionally trades
      try {
        const w = await api.get("/wallet");
        const walletData = w.data?.data || w.data || [];
        setWallet(Array.isArray(walletData) ? walletData : []);
      } catch (e) {
        // non-blocking
      }
      setAmount("");
    } catch (e) {
      const msg = typeof e === "string" ? e : (e?.message || (e?.response?.data?.error) || "Trade failed");
      setErrorMsg(msg);
      notify.showNotification(msg, "error", 5000);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Spot Trading (Backend)</Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Select
              value={coin}
              onChange={e => setCoin(e.target.value)}
              fullWidth
              displayEmpty
              sx={{ mb: 2 }}
              aria-label="select coin"
            >
              <MenuItem value="" disabled>Select Coin</MenuItem>
              {(Array.isArray(coins) ? coins : []).map(c => (
                <MenuItem key={c.symbol} value={c.symbol}>
                  {c.name} ({c.symbol}) — ${Number(priceMap[c.symbol] || 0).toLocaleString()}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={type}
              onChange={e => setType(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              aria-label="select buy or sell"
            >
              <MenuItem value="buy">Buy</MenuItem>
              <MenuItem value="sell">Sell</MenuItem>
            </Select>

            <TextField
              label="Amount"
              value={amount}
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              onChange={e => setAmount(e.target.value)}
              inputProps={{ min: 0, step: "any" }}
            />

            <TextField
              label="Price (USD)"
              value={priceMap[coin] || ""}
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{ readOnly: true }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handlePlaceTrade}
              disabled={!coin || !amount || placing}
              aria-label="place trade"
            >
              {placing ? "Placing..." : "Place Trade"}
            </Button>

            {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="h6" fontWeight={600} mb={1}>My Wallet</Typography>
            {(!wallet || wallet.length === 0) ? (
              <Typography>No assets found.</Typography>
            ) : (
              <Box component="div">
                {wallet.map(w => {
                  const usd = (Number(w.balance || 0) * (priceMap[w.coin] || 0)) || 0;
                  return (
                    <Paper key={w.coin} sx={{ p: 1, mb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <Typography fontWeight={700}>{w.coin}</Typography>
                          <Typography variant="body2" color="text.secondary">{w.address || ""}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography fontWeight={700}>{w.balance}</Typography>
                          <Typography variant="body2" color="text.secondary">${usd.toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <BottomNav />
    </Box>
  );
}