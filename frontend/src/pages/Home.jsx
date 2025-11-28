import React, { useEffect, useState } from "react";
import { getCoins } from "../api";
import {
  Box, Typography, Paper, Grid, IconButton, Avatar, CircularProgress, Divider
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [favCoins, setFavCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCoins().then(r => {
      const coinList = r.data && Array.isArray(r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
      setCoins(coinList);
      setFavCoins(coinList.slice(0, 3));
      setLoading(false);
    }).catch(() => { setCoins([]); setFavCoins([]); setLoading(false); });
  }, []);

  return (
    <Box sx={{
      px: { xs: 1, sm: 2 },
      pt: { xs: 2, sm: 3 },
      pb: 10,
      minHeight: "100vh",
      background: "inherit",
      fontFamily: "inherit"
    }}>
      {/* Balance Section (Real Wallet could be shown here) */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          Balance
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: "#10B981" }}
        >
          $0
        </Typography>
      </Paper>

      {/* Favorite Coins */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={2}>
          Favorite Coins
        </Typography>
        <Grid container spacing={2}>
          {favCoins.map(coin => (
            <Grid item xs={4} key={coin.symbol}>
              <Box sx={{ textAlign: "center" }}>
                <Avatar src={coin.iconUrl || coin.image} sx={{ width: 36, height: 36, mx: "auto", mb: 1 }}>
                  {coin.symbol?.substring(0,2)}
                </Avatar>
                <Typography fontWeight={600} fontSize={15}>{coin.name}</Typography>
                <Typography fontSize={14}>${coin.price?.toLocaleString()}</Typography>
                <IconButton color="primary" onClick={() => navigate(`/market/${coin.symbol}`)}>
                  <ShowChartIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Top Coins */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={2}>
          Top 30 Coins
        </Typography>
        {loading ? (
          <Box sx={{ textAlign: "center", pt: 2 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            {coins.map(coin => (
              <Grid item xs={12} sm={6} md={4} key={coin.symbol}>
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 2, bgcolor: "#181b2a",
                  borderRadius: 2, p: 1, mb: 1, boxShadow: 1
                }}>
                  <Avatar src={coin.iconUrl || coin.image} sx={{ width: 32, height: 32 }}>
                    {coin.symbol?.substring(0,2)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600} fontSize={15}>{coin.name}</Typography>
                    <Typography fontSize={14}>${coin.price?.toLocaleString()}</Typography>
                    <Typography fontSize={14} color={coin.price_change_percentage_24h > 0 ? "#10B981" : "#F43F5E"}>
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </Typography>
                  </Box>
                  <IconButton color="primary" onClick={() => navigate(`/market/${coin.symbol}`)}>
                    <ShowChartIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}