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
  CircularProgress,
  Button,
  Avatar,
  Divider,
} from "@mui/material";
import TopHeader from "../components/TopHeader";
import PortfolioTotalCard from "../components/PortfolioTotalCard";
import api from "../api";

/**
 * Home (Portfolio-focused)
 *
 * - Minimal, professional, dense, mobile-first portfolio dashboard.
 * - Uses only TopHeader and PortfolioTotalCard as requested.
 * - Shows Holdings / Balances pulled from GET /api/wallet/summary.
 *
 * Notes:
 * - This page intentionally omits announcements, chat, favorites, news widgets.
 * - All routing/auth remains unchanged elsewhere.
 */

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
  } catch (e) {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

function formatNumber(value, digits = 6) {
  const v = Number(value || 0);
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/wallet/summary");
      const payload = resp.data?.data || resp.data || null;
      setSummary(payload);
    } catch (e) {
      setError("Failed to load portfolio data");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const holdings = Array.isArray(summary?.balances) ? summary.balances : [];

  const handleTrade = (coin) => {
    // Navigate to trade page for this coin pair (assume USDT base)
    // Keep simple: direct window navigation to existing trade route
    window.location.href = `/trade?pair=${encodeURIComponent(coin + "USDT")}`;
  };

  const handleWithdraw = (coin) => {
    window.location.href = `/wallet?coin=${encodeURIComponent(coin)}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <TopHeader onToggleSidebar={() => {}} onTrade={() => (window.location.href = "/trade")} onWallet={() => (window.location.href = "/wallet")} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Grid container spacing={2}>
          {/* Portfolio total - full width on mobile, compact on desktop */}
          <Grid item xs={12}>
            <PortfolioTotalCard
              onTrade={() => (window.location.href = "/trade")}
              onDeposit={() => (window.location.href = "/wallet")}
            />
          </Grid>

          {/* Holdings / Balances */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", md: "1.125rem" } }}>
                  Holdings
                </Typography>
                <Box>
                  <Button size="small" onClick={fetchSummary} sx={{ mr: 1 }}>Refresh</Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 1 }} />

              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4, justifyContent: "center" }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Loading holdings…</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ py: 3 }}>
                  <Typography variant="body2" color="error">{error}</Typography>
                </Box>
              ) : !holdings.length ? (
                <Box sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No holdings to display.</Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  {/* Dense table on desktop, still readable on mobile */}
                  <Table size="small" aria-label="holdings-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell align="right">Price (USD)</TableCell>
                        <TableCell align="right">Value (USD)</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holdings.map((h) => (
                        <TableRow key={h.coin}>
                          <TableCell component="th" scope="row" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "transparent", color: "text.primary" }}>{h.coin[0]}</Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.coin}</Typography>
                            </Box>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                              {formatNumber(h.balance, 6)} {h.coin}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                              {formatCurrency(h.price || 0, "USD")}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                              {formatCurrency(h.fiatValue || 0, "USD")}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <Button size="small" variant="outlined" onClick={() => handleTrade(h.coin)}>Trade</Button>
                              <Button size="small" variant="contained" onClick={() => handleWithdraw(h.coin)}>Withdraw</Button>
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