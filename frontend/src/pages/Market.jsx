import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Paper, InputBase, Chip, Tabs, Tab, Button, Stack, Grid, CircularProgress, Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { getCoins } from "../api";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Market() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = (searchParams.get("q") || "").trim();

  // Local input state (controlled input) — synced from URL qParam; URL is the source of truth
  const [search, setSearch] = useState(qParam);

  const [tab, setTab] = useState(0);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getCoins()
      .then(r => {
        if (r.data && Array.isArray(r.data.data)) {
          setCoins(r.data.data);
        } else if (Array.isArray(r.data)) {
          setCoins(r.data);
        } else {
          setCoins([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Keep local input synchronized with qParam (URL is canonical)
  useEffect(() => {
    if (qParam !== search) {
      setSearch(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  // When user types in the Market page input, update the URL q param (replace history)
  const onChangeSearch = (e) => {
    const v = e.target.value;
    setSearch(v);

    const next = new URLSearchParams(searchParams);
    if (v && v.trim() !== "") {
      next.set("q", v);
    } else {
      next.delete("q");
    }
    // replace to avoid polluting history on each keystroke
    setSearchParams(next, { replace: true });
  };

  const filteredCoins = Array.isArray(coins)
    ? coins.filter(
        c =>
          c.symbol?.toLowerCase().includes((qParam || "").toLowerCase()) ||
          c.name?.toLowerCase().includes((qParam || "").toLowerCase())
      )
    : [];

  return (
    <Box sx={{
      pt: 2,
      pb: 10,
      px: isMobile ? 0.5 : 2,
      minHeight: "100vh",
      bgcolor: "background.default",
      width: "100vw"
    }}>
      {/* Search Bar */}
      <Paper sx={{
        mx: "auto",
        mb: 2,
        maxWidth: 480,
        p: "4px 12px",
        display: "flex",
        alignItems: "center",
        borderRadius: 2
      }}>
        <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
        <InputBase
          placeholder="Search Coin Pairs"
          value={search}
          onChange={onChangeSearch}
          sx={{ flex: 1, fontWeight: 500 }}
        />
      </Paper>
      {/* Tabs */}
      <Box sx={{ mx: "auto", maxWidth: 480, overflowX: "auto", whiteSpace: "nowrap" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="Favorites" />
          <Tab label="Market" />
          <Tab label="Alpha" />
          <Tab label="Grow" />
          <Tab label="Square" />
          <Tab label="Data" />
        </Tabs>
        <Stack direction="row" spacing={1} sx={{ my: 1, overflowX: "auto", whiteSpace: "nowrap" }}>
          <Chip label="Crypto" />
          <Chip label="Spot" color="primary" />
          <Chip label="USDC" color="primary" />
          <Chip label="USDT" />
          <Chip label="FDUSD" />
          <Chip label="BNB" />
          <Chip label="BTC" />
          <Chip label="ALTS" />
          <Chip label="FIAT" />
        </Stack>
      </Box>
      {/* Coin List */}
      <Paper sx={{
        maxWidth: 800,
        mx: "auto",
        mt: 2,
        p: 0,
        borderRadius: 2,
        overflowX: isMobile ? "auto" : "visible"
      }}>
        <Box sx={{
          px: 2,
          py: 1,
          display: "flex",
          fontSize: 13,
          color: "text.secondary",
          fontWeight: 600,
          minWidth: isMobile ? 440 : "auto"
        }}>
          <Box sx={{ flex: 2 }}>Name / Vol</Box>
          <Box sx={{ flex: 2 }}>Last Price</Box>
          <Box sx={{ flex: 1, textAlign: "right" }}>24h chg%</Box>
        </Box>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
        ) : filteredCoins.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 2 }}>No coins found.</Typography>
        ) : (
          <Grid container spacing={1}>
            {filteredCoins.map((coin, idx) => (
              <Grid item xs={12} sm={6} md={4} key={coin.symbol}>
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: "#181b2a",
                  borderRadius: 2,
                  p: 1,
                  mb: 1,
                  boxShadow: 1,
                  minWidth: isMobile ? 380 : "auto"
                }}>
                  <img src={coin.iconUrl || coin.image} alt={coin.symbol} loading="lazy" width={32} height={32} style={{ borderRadius: 8 }} onError={e => { e.target.onerror = null; e.target.src = "/assets/coins/default.png"; }} />
                  <Box>
                    <Typography fontWeight={600} fontSize={15}>{coin.name}</Typography>
                    <Typography fontSize={14}>${(coin.price ?? coin.current_price)?.toLocaleString()}</Typography>
                    <Typography fontSize={14} color={coin.price_change_percentage_24h > 0 ? "#10B981" : "#F43F5E"}>
                      {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      background: coin.price_change_percentage_24h >= 0 ? "#21c97a" : "#f44336",
                      color: "#fff",
                      borderRadius: 2,
                      fontWeight: 700,
                      minWidth: 70,
                      fontSize: 14,
                      boxShadow: "none",
                      textTransform: "none",
                      marginLeft: "auto"
                    }}
                    onClick={() => navigate(`/market/${coin.symbol}`)}
                  >
                    {(coin.price_change_percentage_24h >= 0 ? "+" : "") + (coin.price_change_percentage_24h ?? 0).toFixed(2) + "%"}
                  </Button>
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