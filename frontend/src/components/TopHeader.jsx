import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Button, Avatar, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

/**
 * TopHeader - compact application header
 * - Mobile-first layout
 * - Shows logo/title, primary actions (Trade, Wallet), and the user avatar
 *
 * Props:
 * - onToggleSidebar?() optional
 * - onTrade() optional
 * - onWallet() optional
 */
export default function TopHeader({ onToggleSidebar, onTrade, onWallet }) {
  const theme = useTheme();

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default }}>
      <Toolbar sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "center", minHeight: 56 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggleSidebar} sx={{ display: { xs: "inline-flex", md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
            }}>
              AX
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Aexon Admin
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={onTrade} size="small">
            Trade
          </Button>
          <Button variant="contained" color="primary" startIcon={<AccountBalanceWalletIcon />} onClick={onWallet} size="small">
            Wallet
          </Button>

          <Avatar sx={{ width: 36, height: 36, ml: 1 }} alt="Admin" src="" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}