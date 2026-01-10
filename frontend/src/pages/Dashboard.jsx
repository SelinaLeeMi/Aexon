import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import TopHeader from "../components/TopHeader";
import PortfolioTotalCard from "../components/PortfolioTotalCard";
import api from "../api";

/**
 * Dashboard - professional portfolio-focused trading dashboard
 *
 * - Mobile-first, dense, institutional layout
 * - Dark surface styling applied locally to avoid changing global theme
 * - Uses existing backend endpoints (no backend edits)
 * - Keeps only portfolio-related UI: total + holdings/balances
 * - Removes announcements, chat, favorites, news, demo widgets
 *
 * Notes:
 * - Do not change routing/auth/context/backend
 * - No console.logs
 */

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

function formatNumber(value, maxDigits = 6) {
  const v = Number(value || 0);
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/wallet/summary");
      const data = resp.data?.data || resp.data || null;
      setSummary(data);
    } catch (e) {
      setError("Unable to load portfolio data.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const holdings = Array.isArray(summary?.balances) ? summary.balances : [];

  const handleTrade = (coin) => {
    // Navigate to trade page for the pair (assume USDT base)
    window.location.href = `/trade?pair=${encodeURIComponent(coin + "USDT")}`;
  };

  const handleDeposit = (coin) => {
    window.location.href = `/wallet?coin=${encodeURIComponent(coin)}`;
  };

  // Local dark surface tokens (kept on page only)
  const surface = "#0f1724";
  const pageBg = "#0b1220";
  const cardBorder = "rgba(255,255,255,0.04)";
  const muted = "rgba(255,255,255,0.7)";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: pageBg, color: "#E6EEF8" }}>
      <TopHeader onToggleSidebar={() => {}} onTrade={() => (window.location.href = "/trade")} onWallet={() => (window.location.href = "/wallet")} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ mb: 0 }}>
              {/* PortfolioTotalCard uses wallet/summary endpoint internally; keep it as primary summary */}
              <PortfolioTotalCard
                onTrade={() => (window.location.href = "/trade")}
                onDeposit={() => (window.location.href = "/wallet")}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                backgroundColor: surface,
                border: `1px solid ${cardBorder}`,
                p: { xs: 1, md: 2 },
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Holdings
                </Typography>
                <Box>
                  <Button size="small" onClick={fetchSummary} sx={{ color: muted, borderColor: cardBorder, mr: 1 }}>
                    Refresh
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ borderColor: cardBorder, mb: 1 }} />

              {loading ? (
                <Box sx={{ py: 3, display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body2" color="text.secondary">Loading holdings…</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ py: 3 }}>
                  <Typography variant="body2" color="error.main">{error}</Typography>
                </Box>
              ) : !holdings.length ? (
                <Box sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No assets in your portfolio.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <Table size="small" aria-label="dashboard-holdings" sx={{ minWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "#E6EEF8" }}>Asset</TableCell>
                        <TableCell align="right" sx={{ color: "#E6EEF8" }}>Balance</TableCell>
                        <TableCell align="right" sx={{ color: "#E6EEF8" }}>Price (USD)</TableCell>
                        <TableCell align="right" sx={{ color: "#E6EEF8" }}>Value (USD)</TableCell>
                        <TableCell align="right" sx={{ color: "#E6EEF8" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holdings.map((h) => (
                        <TableRow key={h.coin} hover sx={{ borderBottom: `1px solid ${cardBorder}` }}>
                          <TableCell component="th" scope="row" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: "transparent", color: "#fff", fontSize: 14 }}>
                              {h.coin?.slice(0, 1) || "A"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{h.coin}</Typography>
                              {h.price != null && (
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                                  {formatCurrency(h.price, "USD")} / unit
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            <Typography variant="body2">{formatNumber(h.balance, 6)} {h.coin}</Typography>
                          </TableCell>

                          <TableCell align="right" sx={{ color: "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(h.price || 0, "USD")}
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(h.fiatValue || 0, "USD")}
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <Button size="small" variant="outlined" onClick={() => handleTrade(h.coin)} sx={{ color: "#E6EEF8", borderColor: cardBorder }}>
                                Trade
                              </Button>
                              <Button size="small" variant="contained" onClick={() => handleDeposit(h.coin)}>
                                Withdraw
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}