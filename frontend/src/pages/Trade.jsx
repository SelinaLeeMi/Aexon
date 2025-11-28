/**
 * Updated Trade page
 *
 * - Uses RealtimeProvider (useRealtime) to show live prices.
 * - Uses tradeService.placeTrade and getMyTrades for backend-trusted execution.
 * - Shows local loading state, error messages and refreshes trades and balances after trades.
 *
 * Note: Ensure you wrap your app with <RealtimeProvider> in App.jsx for realtime data (I added context file above).
 */
import React, { useEffect, useMemo, useState } from "react";
import { getCoins, getWallet } from "../api";
import {
  Box, Typography, Paper, Select, MenuItem, TextField, Button, Grid, Alert, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress
} from "@mui/material";
import BottomNav from "../components/BottomNav";
import { placeTrade, getMyTrades } from "../services/tradeService";
import { useRealtime } from "../context/RealtimeContext";

export default function Trade() {
  const [coins, setCoins] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [coin, setCoin] = useState("");
  const [type, setType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const realtime = useRealtime();

  useEffect(() => {
    setLoading(true);
    getCoins().then(r => {
      const arr = r.data?.data || r.data || [];
      setCoins(arr);
      if (arr.length && !coin) setCoin(arr[0].symbol);
    }).catch(() => setCoins([]));

    getWallet().then(r => {
      const w = r.data?.data || r.data || [];
      setWallet(w);
    }).catch(() => setWallet([]));

    getMyTradesList();
    setLoading(false);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Listen for realtime price updates to refresh UI if available
    // No direct subscription needed; RealtimeContext updates will re-render.
  }, [realtime?.prices]);

  const getMyTradesList = async () => {
    try {
      const res = await getMyTrades();
      // backend returns { success, data } or array
      const rows = res?.data || res || [];
      setTrades(Array.isArray(rows) ? rows : (rows.rows || []));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // When a trade is executed elsewhere (via WebSocket), refresh trades list
    // RealtimeContext may push trade_executed events into trades array; we also occasionally refresh from backend
    if (realtime?.trades && realtime.trades.length) {
      // merge a few latest from realtime
      setTrades(prev => {
        const merged = [...realtime.trades, ...prev];
        // dedupe by id if exists
        const seen = new Set();
        return merged.filter(t => {
          const id = t._id || t.id || (t.timestamp + JSON.stringify(t));
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        }).slice(0, 200);
      });
    }
    // eslint-disable-next-line
  }, [realtime?.trades]);

  const priceOf = useMemo(() => {
    const map = {};
    coins.forEach(c => map[c.symbol] = Number(c.price ?? c.current_price ?? 0));
    // include realtime overrides
    if (realtime?.prices) {
      Object.keys(realtime.prices).forEach(sym => {
        const s = sym.toUpperCase();
        const val = realtime.prices[s];
        if (val) map[s] = Number(val.price ?? val.current_price ?? val);
      });
    }
    return map;
  }, [coins, realtime?.prices]);

  const handleTrade = async () => {
    setMsg("");
    if (!coin || !amount || Number(amount) <= 0) {
      setMsg("Please enter valid amount and select coin.");
      return;
    }
    const price = priceOf[coin] || 0;
    setPlacing(true);
    try {
      await placeTrade({
        type,
        coinSymbol: coin,
        amount: Number(amount),
        price
      });
      setMsg("Trade placed successfully.");
      setAmount("");
      // refresh wallets & trades
      getWallet().then(r => setWallet(r.data?.data || r.data || []));
      getMyTradesList();
    } catch (e) {
      setMsg(typeof e === "string" ? e : (e?.message || "Trade failed"));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, textAlign: "center" }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Spot Trade (Live)</Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Select
              value={coin}
              onChange={e => setCoin(e.target.value)}
              fullWidth
              displayEmpty
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select Coin</MenuItem>
              {(Array.isArray(coins) ? coins : []).map(c => (
                <MenuItem key={c.symbol} value={c.symbol}>
                  {c.name} ({c.symbol}) — ${Number(priceOf[c.symbol] || 0).toLocaleString()}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={type}
              onChange={e => setType(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
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
            />
            <TextField
              label="Price (USD)"
              value={priceOf[coin] || ""}
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleTrade}
              disabled={!coin || !amount || placing}
            >
              {placing ? "Placing..." : "Place Trade"}
            </Button>
            {msg && <Alert severity={msg.includes("success") ? "success" : "error"} sx={{ mt: 2 }}>{msg}</Alert>}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="h6" fontWeight={600} mb={1}>My Wallet</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Coin</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>USD Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(wallet || []).map(w => (
                  <TableRow key={w.coin}>
                    <TableCell>{w.coin}</TableCell>
                    <TableCell>{w.balance}</TableCell>
                    <TableCell>${((Number(w.balance || 0) * (priceOf[w.coin] || 0)) || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Trade History</Typography>
        {trades.length === 0 ? (
          <Typography>No trades yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pair</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((t, idx) => (
                <TableRow key={t._id || idx}>
                  <TableCell>{t.pair}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>${t.price}</TableCell>
                  <TableCell>{t.status || "filled"}</TableCell>
                  <TableCell>{new Date(t.createdAt || t.timestamp || Date.now()).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <BottomNav />
    </Box>
  );
}