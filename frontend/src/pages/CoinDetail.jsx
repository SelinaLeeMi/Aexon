import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCoins } from "../api";
import { Paper, Typography, Avatar, Box, Button, CircularProgress, Alert } from "@mui/material";

/**
 * Lightweight CoinDetail page used by some routes: shows quick coin info.
 * Uses backend getCoins (which returns coins array).
 */
export default function CoinDetail() {
  const { coinId } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getCoins()
      .then(res => {
        const arr = res.data?.data || res.data || [];
        const found = arr.find(c => (c.symbol || "").toLowerCase() === (coinId || "").toLowerCase());
        setCoin(found || null);
      })
      .catch(() => setError("Failed to load coin"))
      .finally(() => setLoading(false));
  }, [coinId]);

  if (loading) return <CircularProgress sx={{ p: 3 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!coin) return <Typography sx={{ p: 3 }}>Coin not found.</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={coin.iconUrl || coin.image} sx={{ width: 60, height: 60 }} />
          <Typography variant="h4" fontWeight={700}>{coin.name} ({(coin.symbol || "").toUpperCase()})</Typography>
        </Box>
        <Typography variant="h5" sx={{ mt: 2 }}>Price: ${Number(coin.price || coin.current_price || 0).toLocaleString()}</Typography>
        <Typography sx={{ mt: 2 }}>24h Change: {Number(coin.price_change_percentage_24h || 0).toFixed(2)}%</Typography>
        <Button variant="contained" color="success" sx={{ mt: 4 }} href="/trade">Trade</Button>
      </Paper>
    </Box>
  );
}