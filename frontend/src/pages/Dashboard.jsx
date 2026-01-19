import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import api from "../api";

/**
 * Dashboard - Professional trading-product layout
 *
 * - The global TopHeader is rendered only in App.jsx (AppContent).
 * - This page no longer renders any header. It focuses on portfolio summary and market movers.
 * - Mobile-first, dense, institutional dark style.
 */

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

function percentString(value) {
  const v = Number(value || 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [summary, setSummary] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [errorSummary, setErrorSummary] = useState(null);
  const [errorCoins, setErrorCoins] = useState(null);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await api.get("/wallet/summary");
      const data = res.data?.data || res.data || null;
      setSummary(data);
    } catch (e) {
      setErrorSummary("Failed to load portfolio summary");
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchCoins = async () => {
    setLoadingCoins(true);
    setErrorCoins(null);
    try {
      const res = await api.get("/coin");
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setCoins(list);
    } catch (e) {
      setErrorCoins("Failed to load market data");
      setCoins([]);
    } finally {
      setLoadingCoins(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCoins();
  }, []);

  const totals = useMemo(() => {
    const totalNow = Number(summary?.totalFiat || 0);
    let prevTotal = null;
    try {
      if (summary?.balances && Array.isArray(summary.balances) && coins.length > 0) {
        const priceMap = new Map();
        for (const c of coins) {
          if (c && c.symbol) priceMap.set(String(c.symbol).toUpperCase(), c);
        }
        let accumPrev = 0;
        let havePrev = false;
        for (const b of summary.balances) {
          const coin = String(b.coin).toUpperCase();
          const balance = Number(b.balance || 0);
          const coinInfo = priceMap.get(coin);
          if (coinInfo && typeof coinInfo.previousPrice === "number" && coinInfo.previousPrice > 0) {
            accumPrev += balance * Number(coinInfo.previousPrice);
            havePrev = true;
          } else if (coinInfo && typeof coinInfo.price === "number") {
            accumPrev += balance * Number(coinInfo.price);
          }
        }
        if (havePrev) prevTotal = accumPrev;
      }
    } catch {
      prevTotal = null;
    }
    const absoluteChange = prevTotal != null ? (totalNow - prevTotal) : null;
    const percentChange = (prevTotal && prevTotal !== 0) ? (absoluteChange / prevTotal) * 100 : null;
    return { totalNow, prevTotal, absoluteChange, percentChange };
  }, [summary, coins]);

  const marketMovers = useMemo(() => {
    if (!coins || coins.length === 0) return { gainers: [], losers: [] };
    const rows = coins
      .filter(c => c && typeof c.price === "number")
      .map(c => {
        const symbol = String(c.symbol || "").toUpperCase();
        const price = Number(c.price || 0);
        const prev = (typeof c.previousPrice === "number" && c.previousPrice > 0) ? Number(c.previousPrice) : null;
        const change = prev ? ((price - prev) / prev) * 100 : 0;
        return { symbol, price, change };
      });
    const sorted = rows.sort((a, b) => (b.change - a.change));
    const gainers = sorted.slice(0, 6);
    const losers = sorted.slice(-6).reverse();
    return { gainers, losers };
  }, [coins]);

  const tradePrimary = () => {
    window.location.href = "/trade";
  };

  const surface = "#0f1724";
  const pageBg = "#0b1220";
  const border = "rgba(255,255,255,0.06)";
  const muted = "rgba(255,255,255,0.72)";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: pageBg, color: "#E6EEF8", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg" sx={{ width: "100%", maxWidth: 1200 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ backgroundColor: surface, border: `1px solid ${border}`, p: { xs: 1, md: 2 }, borderRadius: 2 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle2" sx={{ color: muted, fontWeight: 700 }}>Portfolio Value</Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
                    {loadingSummary ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Loading…</Typography>
                      </Box>
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatCurrency(totals.totalNow, "USD")}</Typography>
                    )}

                    {!loadingSummary && totals.percentChange != null ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ color: totals.percentChange >= 0 ? "#16A34A" : "#DC2626", fontWeight: 700 }}>
                          {totals.percentChange >= 0 ? "+" : ""}{totals.percentChange.toFixed(2)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: muted }}>24h</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: muted }}>24h change unavailable</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Updated: {summary?.fetchedAt ? new Date(summary.fetchedAt).toLocaleString() : "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                  <Button variant="contained" color="primary" onClick={tradePrimary} sx={{ px: 3 }}>Trade</Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ backgroundColor: surface, border: `1px solid ${border}`, p: { xs: 1, md: 2 }, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Top Gainers (24h)</Typography>
                  <Divider sx={{ borderColor: border, mb: 1 }} />
                  {loadingCoins ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
                      <CircularProgress size={18} color="inherit" />
                      <Typography variant="body2" sx={{ color: muted }}>Loading market data…</Typography>
                    </Box>
                  ) : (marketMovers.gainers && marketMovers.gainers.length > 0) ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {marketMovers.gainers.map(m => (
                        <Box key={m.symbol} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.75 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                              {m.symbol.slice(0,1)}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.symbol}</Typography>
                              <Typography variant="caption" sx={{ color: muted }}>{formatCurrency(m.price, "USD")}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: "#16A34A", fontWeight: 700 }}>{percentString(m.change)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ color: muted }}>No market mover data available.</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ backgroundColor: surface, border: `1px solid ${border}`, p: { xs: 1, md: 2 }, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Top Losers (24h)</Typography>
                  <Divider sx={{ borderColor: border, mb: 1 }} />
                  {loadingCoins ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
                      <CircularProgress size={18} color="inherit" />
                      <Typography variant="body2" sx={{ color: muted }}>Loading market data…</Typography>
                    </Box>
                  ) : (marketMovers.losers && marketMovers.losers.length > 0) ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {marketMovers.losers.map(m => (
                        <Box key={m.symbol} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.75 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                              {m.symbol.slice(0,1)}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.symbol}</Typography>
                              <Typography variant="caption" sx={{ color: muted }}>{formatCurrency(m.price, "USD")}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: "#DC2626", fontWeight: 700 }}>{percentString(m.change)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ color: muted }}>No market mover data available.</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}