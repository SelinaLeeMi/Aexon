import React, { useState } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Button, Avatar, TextField, InputAdornment, Menu, MenuItem, useTheme, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";

/**
 * TopHeader
 *
 * - Single global header for the app.
 * - Contains logo, global search, and profile/menu.
 * - Mobile-first and compact.
 *
 * Props:
 * - onToggleSidebar(): toggles AppDrawer
 * - onTrade(): optional callback to navigate to trade
 * - onWallet(): optional callback to navigate to wallet
 */

export default function TopHeader({ onToggleSidebar, onTrade, onWallet }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const onSearchSubmit = (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const performSearch = () => {
    const q = (search || "").trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const openProfileMenu = (evt) => {
    setAnchorEl(evt.currentTarget);
  };
  const closeProfileMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: `1px solid rgba(255,255,255,0.06)`, backgroundColor: theme.palette.background.default }}>
      <Toolbar sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "center", minHeight: 56 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggleSidebar} sx={{ display: { xs: "inline-flex", md: "none" } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14
            }}>
              AX
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>
              Aexon
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, mx: 2, display: "flex", justifyContent: "center" }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchSubmit}
            placeholder="Search markets, symbols, or users"
            size="small"
            variant="outlined"
            sx={{
              width: { xs: "100%", sm: 560 },
              backgroundColor: "rgba(255,255,255,0.02)",
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": { border: "1px solid rgba(255,255,255,0.04)" }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="search" onClick={performSearch} edge="end" size="small">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!isMobile && (
            <Button color="inherit" onClick={onTrade}>Trade</Button>
          )}
          <IconButton color="inherit" onClick={openProfileMenu} size="large">
            <AccountCircleIcon sx={{ width: 28, height: 28 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeProfileMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={() => { closeProfileMenu(); navigate("/profile"); }}>Profile</MenuItem>
            <MenuItem onClick={() => { closeProfileMenu(); navigate("/wallet"); }}>Wallet</MenuItem>
            <MenuItem onClick={() => { closeProfileMenu(); navigate("/logout"); }}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}