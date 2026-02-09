import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";

/**
 * TopHeader
 *
 * Search logic updated to allow admin users to reach the admin panel via search.
 * Visuals, layout, and styles unchanged.
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
    // Read user from localStorage to match AdminRoute logic
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const q = (search || "").trim().toLowerCase();

    // Admin keyword list (case-insensitive substring match)
    const adminKeywords = ["admin", "admin panel", "dashboard", "super"];
    const isAdminQuery = adminKeywords.some((kw) => q.includes(kw));

    if (isAdminQuery && user && user.role === "admin") {
      navigate("/super-0xA35-panel");
      return;
    }

    // After admin check, fallback to market behavior
    if (!q) {
      navigate("/market");
      return;
    }

    navigate(`/market?q=${encodeURIComponent((search || "").trim())}`);
  };

  const openProfileMenu = (evt) => {
    setAnchorEl(evt.currentTarget);
  };
  const closeProfileMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 56,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onToggleSidebar}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Brand area: wordmark */}
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
            aria-label="home"
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}
            >
              Aexon
            </Typography>
          </Box>
        </Box>

        {/* Search - navigates to /market or admin panel when allowed */}
        <Box sx={{ flex: 1, mx: 2, display: "flex", justifyContent: "center" }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchSubmit}
            placeholder="Search markets, symbols, or users"
            size="small"
            variant="outlined"
            aria-label="Global search"
            fullWidth={false}
            sx={{
              width: { xs: "100%", sm: 560 },
              backgroundColor: theme.palette.background.paper,
              borderRadius: `${theme.shape.borderRadius}px`,
              "& .MuiOutlinedInput-notchedOutline": { border: `1px solid ${theme.palette.divider}` },
            }}
            InputProps={{
              sx: { borderRadius: `${theme.shape.borderRadius}px` },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="search"
                    onClick={performSearch}
                    edge="end"
                    size="small"
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!isMobile && (
            <Button color="inherit" onClick={onTrade}>
              Trade
            </Button>
          )}

          {/* Minimal profile icon (no initials/badge) */}
          <IconButton
            color="inherit"
            onClick={openProfileMenu}
            size="large"
            aria-label="profile"
          >
            <AccountCircleIcon sx={{ width: 28, height: 28 }} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeProfileMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                closeProfileMenu();
                navigate("/profile");
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeProfileMenu();
                navigate("/wallet");
              }}
            >
              Wallet
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeProfileMenu();
                navigate("/logout");
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}