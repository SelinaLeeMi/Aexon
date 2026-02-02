import React from "react";
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box, Typography
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";

const menu = [
  { text: "Home", icon: <HomeIcon />, path: "/" },
  { text: "Profile", icon: <PersonIcon />, path: "/profile" },
  { text: "Wallet", icon: <WalletIcon />, path: "/wallet" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  { text: "Support", icon: <SupportAgentIcon />, path: "/support" },
  { text: "Logout", icon: <LogoutIcon />, path: "/login" },
];

export default function AppDrawer({ open, onClose, user }) {
  const navigate = useNavigate();

  return (
    <Drawer anchor="left" open={open} onClose={onClose} aria-label="main navigation drawer">
      <Box sx={{ width: 260 }}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          {/* Minimal neutral icon instead of circular avatar */}
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#fff"
          }}>
            <AccountCircleIcon sx={{ width: 36, height: 36 }} />
          </Box>
          <Box>
            <Typography fontWeight={700}>{user?.username || "User"}</Typography>
            <Typography fontSize={13} color="text.secondary">{user?.email}</Typography>
          </Box>
        </Box>
        <Divider />
        <List>
          {menu.map(item => (
            <ListItem
              button
              key={item.text}
              aria-label={item.text}
              onClick={() => { onClose(); navigate(item.path); }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}