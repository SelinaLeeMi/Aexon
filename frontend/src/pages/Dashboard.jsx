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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import TopHeader from "../components/TopHeader";
import PortfolioTotalCard from "../components/PortfolioTotalCard";
import api from "../api";

/**
 * Dashboard (improved)
 *
 * - Professional, dense, mobile-first trading dashboard.
 * - Dark institutional styling kept locally.
 * - Uses GET /api/wallet/summary for holdings (no backend changes).
 * - No announcements/chat/news/demo widgets.
 *
 * Layout improvements:
 * - Max container width (centered)
 * - Reduced vertical spacing and a tight grid
 * - Portfolio card hierarchy tightened (title, value, actions alignment)
 * - Holdings: proper table on desktop, stacked compact cards on mobile
 * - Professional empty-state placed inside table body
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    window.location.href = `/trade?pair=${encodeURIComponent(coin + "USDT")}`;
  };

  const handleWithdraw = (coin) => {
    window.location.href = `/wallet?coin=${encodeURIComponent(coin)}`;
  };

  // local visual tokens for dark/institutional look
  const surface = "#0f1724";
  const pageBg = "#0b1220";
  const cardBorder = "rgba(255,255,255,0.06)";
  const captionColor = "rgba(255,255,255,0.72)";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: pageBg, color: "#E6EEF8" }}>
      <TopHeader onToggleSidebar={() => {}} onTrade={() => (window.location.href = "/trade")} onWallet={() => (window.location.href = "/wallet")} />

      <Container
        maxWidth={false}
        sx={{
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1300 }}>
          <Grid container spacing={2}>
            {/* Portfolio total - tight card */}
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
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    {/* Title + value stacked compactly */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Portfolio Value
                    </Typography>
                    <PortfolioTotalCard
                      onTrade={() => (window.location.href = "/trade")}
                      onDeposit={() => (window.location.href = "/wallet")}
                    />
                  </Box>

                  {/* Condense quick actions to the side on larger screens */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: { xs: 1, sm: 0 } }}>
                    <Button variant="contained" color="primary" onClick={() => (window.location.href = "/trade")}>
                      Trade
                    </Button>
                    <Button variant="outlined" onClick={() => (window.location.href = "/wallet")}>
                      Wallet
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Holdings */}
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
                    <Button size="small" onClick={fetchSummary} sx={{ color: captionColor, borderColor: cardBorder }}>
                      Refresh
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: cardBorder, mb: 1 }} />

                {loading ? (
                  <Box sx={{ py: 3, display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                    <CircularProgress size={20} color="inherit" />
                    <Typography variant="body2" color="text.secondary">
                      Loading holdings…
                    </Typography>
                  </Box>
                ) : error ? (
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body2" color="error.main">{error}</Typography>
                  </Box>
                ) : holdings.length === 0 ? (
                  <Table size="small" sx={{ minWidth: 320 }}>
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
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 6 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                              No assets in your portfolio
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                              Your portfolio will appear here once you deposit funds or execute trades.
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                              <Button variant="contained" onClick={() => (window.location.href = "/wallet")}>Deposit Funds</Button>
                              <Button variant="outlined" onClick={() => (window.location.href = "/trade")}>Explore Markets</Button>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <>
                    {/* Desktop table, mobile stacked cards */}
                    {isMobile ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {holdings.map((h) => (
                          <Paper key={h.coin} elevation={0} sx={{ backgroundColor: "#0b1624", border: `1px solid ${cardBorder}`, p: 1.25, borderRadius: 1.5 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "transparent", color: "#fff", fontSize: 14 }}>{h.coin?.slice(0, 1) || "A"}</Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{h.coin}</Typography>
                                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>{formatCurrency(h.price || 0, "USD")} / unit</Typography>
                                </Box>
                              </Box>

                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(h.fiatValue || 0, "USD")}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>{formatNumber(h.balance, 6)} {h.coin}</Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
                              <Button size="small" variant="outlined" onClick={() => handleTrade(h.coin)} sx={{ color: "#E6EEF8", borderColor: cardBorder }}>Trade</Button>
                              <Button size="small" variant="contained" onClick={() => handleWithdraw(h.coin)}>Withdraw</Button>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <Table size="small" aria-label="holdings-table" sx={{ minWidth: 720 }}>
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
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: "transparent", color: "#fff", fontSize: 14 }}>{h.coin?.slice(0, 1) || "A"}</Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{h.coin}</Typography>
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>{formatCurrency(h.price || 0, "USD")} / unit</Typography>
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
                                    <Button size="small" variant="contained" onClick={() => handleWithdraw(h.coin)}>
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
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}