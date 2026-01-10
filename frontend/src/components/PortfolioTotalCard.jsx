import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Button, CircularProgress } from "@mui/material";
import api from "../api";

/**
 * PortfolioTotalCard
 *
 * Fetches /wallet/summary and displays:
 * - totalFiat (USD)
 * - small 24h change (if available)
 * - quick actions: Trade, Deposit
 *
 * Behavior:
 * - Shows skeleton/loader while fetching
 * - Keeps UI minimal and professional
 *
 * Note: This component expects backend endpoint GET /api/wallet/summary to exist.
 */

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
  } catch (e) {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

export default function PortfolioTotalCard({ onTrade, onDeposit }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/wallet/summary");
      const payload = resp.data?.data || resp.data || null;
      setSummary(payload);
    } catch (e) {
      setError("Failed to load portfolio total");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // intentionally no dependencies to fetch once on mount
  }, []);

  const total = summary?.totalFiat ?? 0;
  // Derive 24h change if balances include it (fallback to null)
  // The API currently provides price per coin and balances; compute change if possible is left to future.
  const changePercent = null;

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Portfolio Value</Typography>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Loading total...</Typography>
            </Box>
          ) : error ? (
            <Typography variant="body2" color="error">{error}</Typography>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(total, "USD")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Updated: {summary?.fetchedAt ? new Date(summary.fetchedAt).toLocaleString() : "—"}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: { xs: 1, sm: 0 } }}>
          <Button variant="contained" color="primary" onClick={onTrade} disabled={loading}>
            Trade
          </Button>
          <Button variant="outlined" onClick={onDeposit} disabled={loading}>
            Deposit
          </Button>
          <Button variant="text" onClick={fetchSummary} disableElevation>
            Refresh
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}