import React, { useEffect, useState } from "react";
import { getMe, getWallet, getCoins } from "../api";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Grid, useMediaQuery, TextField, Autocomplete
} from "@mui/material";
import Announcements from "../components/Announcements";
import CryptoNews from "../components/CryptoNews";
import ChatSupport from "../components/ChatSupport";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState([]);
  const [coins, setCoins] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    getMe(token)
      .then(r => {
        setUser(r.data.data);
        localStorage.setItem("user", JSON.stringify(r.data.data));
      })
      .catch(() => {
        localStorage.clear();
        navigate("/login");
      });

    getWallet(token)
      .then(r => {
        const wallets = Array.isArray(r.data?.data)
          ? r.data.data
          : Array.isArray(r.data)
            ? r.data
            : Array.isArray(r.data.wallets)
              ? r.data.wallets
              : [];
        setWallet(wallets);
      })
      .catch(() => setWallet([]));

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
      .catch(() => setCoins([]));
  }, [navigate]);

  useEffect(() => {
    setSearchOptions([
      ...(Array.isArray(coins) ? coins : []).map(c => ({ label: `Coin: ${c.symbol} - ${c.name}`, value: `/market/${c.symbol}` })),
      { label: "Wallet", value: "/wallet" },
      { label: "Trade", value: "/trade" },
      { label: "Futures", value: "/futures" },
      { label: "Profile", value: "/profile" },
      { label: "Support", value: "/support" },
      { label: "Settings", value: "/settings" },
      { label: "Deposit", value: "/wallet?tab=deposit" },
      { label: "Withdraw", value: "/wallet?tab=withdraw" },
      ...(user?.role === "admin" ? [{ label: "Admin Panel", value: "/super-0xA35-panel" }] : [])
    ]);
  }, [coins, user]);

  const handleSearchSelect = (event, option) => {
    if (option && option.value) {
      navigate(option.value);
      setSearchInput("");
    }
  };

  // SUPPORT magic code: springthegoat (case-insensitive, ignore spaces/numbers/exclamation)
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      const normalized = searchInput.trim().toLowerCase().replace(/[\s0-9!]/g, "");
      if (normalized === "springthegoat" && user?.role === "admin") {
        setSearchInput("");
        navigate("/super-0xA35-panel");
      }
    }
  };

  const welcomeName =
    user?.username && !user?.username.startsWith("aexonuser_")
      ? user.username
      : "Aexon User";

  const totalUsdBalance = (() => {
    if (!wallet || !coins) return 0;
    let sum = 0;
    wallet.forEach(w => {
      const coin = coins.find(c => c.symbol?.toUpperCase() === w.coin?.toUpperCase());
      const price = coin?.price ?? coin?.current_price ?? 0;
      if (coin && price) {
        sum += Number(w.balance || 0) * Number(price);
      }
    });
    return sum;
  })();

  useEffect(() => {
    setDebugInfo(
      "DEBUG INFO:\n" +
      "User: " + JSON.stringify(user, null, 2) + "\n\n" +
      "Wallet: " + JSON.stringify(wallet, null, 2) + "\n\n" +
      "Coins: " + JSON.stringify(coins, null, 2)
    );
    if (typeof window !== "undefined") {
      console.log("USER:", user);
      console.log("WALLET:", wallet);
      console.log("COINS:", coins);
    }
  }, [user, wallet, coins]);

  return (
    <Box sx={{
      p: { xs: 1, sm: 3 },
      pb: 8,
      mt: isMobile ? 1 : 2,
      width: "100%",
      maxWidth: 1200,
      mx: "auto"
    }}>
      {/* Only ONE search bar, at the very top */}
      <Box sx={{
        mb: 2,
        mt: 1,
        px: isMobile ? 0.5 : 0,
      }}>
        <Autocomplete
          freeSolo
          disableClearable
          options={searchOptions}
          getOptionLabel={option => option.label || ""}
          value={null}
          inputValue={searchInput}
          onInputChange={(_, val) => setSearchInput(val)}
          onChange={handleSearchSelect}
          renderInput={params => (
            <TextField
              {...params}
              label="Search coins, features, or actions..."
              variant="outlined"
              fullWidth
              size="small"
              sx={{
                bgcolor: "#232c3c",
                borderRadius: 2,
                input: { color: "#fff" }
              }}
              InputProps={{
                ...params.InputProps,
                style: { fontSize: isMobile ? 15 : 18 }
              }}
              onKeyDown={handleSearchKeyDown}
            />
          )}
        />
      </Box>

      {/* Welcome and Balance */}
      <Paper sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 3,
        background: "linear-gradient(90deg, #20263a 60%, #1a2132 100%)",
        textAlign: isMobile ? "center" : "left"
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} mb={1}>
          Welcome, {welcomeName}
        </Typography>
        <Typography variant={isMobile ? "body1" : "h6"} sx={{ mb: 2 }}>
          Balance: <span style={{ color: "#10B981", fontWeight: 700 }}>{totalUsdBalance.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })}</span>
        </Typography>
      </Paper>

      <Paper sx={{ mb: 4, p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
        <Typography variant={isMobile ? "body1" : "h6"} fontWeight={600} mb={2}>
          Favorite Coins
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          {(Array.isArray(coins) ? coins : []).slice(0, 3).map(coin => (
            <Grid item xs={12} sm={4} key={coin.symbol}>
              <Box sx={{
                textAlign: "center",
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                alignItems: "center",
                justifyContent: isMobile ? "flex-start" : "center",
                gap: isMobile ? 1 : 0
              }}>
                <img
                  src={coin.iconUrl || coin.image}
                  alt={coin.symbol}
                  loading="lazy"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    objectFit: "contain",
                    background: "#222"
                  }}
                  onError={e => { e.target.onerror = null; e.target.src = "/assets/coins/default.png"; }}
                />
                <Box sx={{ textAlign: isMobile ? "left" : "center" }}>
                  <Typography fontWeight={600} fontSize={isMobile ? 14 : 15}>{coin.name}</Typography>
                  <Typography fontSize={isMobile ? 13 : 14} color="text.secondary">
                    {(coin.price ?? coin.current_price)?.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Announcements />
      <CryptoNews />
      <ChatSupport />
      {/* Debug info for devs only */}
      {/* <Paper sx={{ mt: 3, p: 2, borderRadius: 2, background: "#232c3c" }}>
        <pre style={{ color: "#ffaa00", fontSize: 13, margin: 0 }}>{debugInfo}</pre>
      </Paper> */}
    </Box>
  );
}