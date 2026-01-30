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
 * TopHeader (visual-only refinement)
 *
 * Visual rules applied:
 * - Removed gradients / decorative badges.
 * - Replaced AX avatar badge with a neutral, minimal square mark (no gradient, no badge).
 * - Search input: Enter key or search icon click navigates:
 *     - if input has text -> /search?q=<query>
 *     - if input empty -> /markets
 *
 * NOTE: No logic, routing, API, auth, or state behavior other than *navigation target for search* was modified.
 * The search behavior is strictly navigation-only and respects existing routing.
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
    if (!q) {
      // Empty search takes the user to the markets overview
      navigate("/markets");
      return;
    }
    // Non-empty search goes to the search page with query param
    navigate(`/search?q=${encodeURIComponent(q)}`);
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

          {/* Neutral minimal mark — no gradient, no decorative badge */}
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
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: 14,
              }}
              aria-hidden
            >
              AX
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}
            >
              Aexon
            </Typography>
          </Box>
        </Box>

        {/* Search - must navigate on Enter or search icon click */}
        <Box sx={{ flex: 1, mx: 2, display: "flex", justifyContent: "center" }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchSubmit}
            placeholder="Search markets, symbols, or users"
            size="small"
            variant="outlined"
            aria-label="Global search"
            sx={{
              width: { xs: "100%", sm: 560 },
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": { border: `1px solid ${theme.palette.divider}` },
            }}
            InputProps={{
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
          {/* Keep Trade button visually minimal and themed */}
          {!isMobile && (
            <Button color="inherit" onClick={onTrade}>
              Trade
            </Button>
          )}

          {/* Minimal profile icon (no initials badge) */}
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