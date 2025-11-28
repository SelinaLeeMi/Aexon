import React, { useState, useEffect } from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", icon: <HomeIcon />, route: "/" },
  { label: "Market", icon: <ShowChartIcon />, route: "/market" },
  { label: "Trade", icon: <CurrencyExchangeIcon />, route: "/trade" },
  { label: "Wallet", icon: <AccountBalanceWalletIcon />, route: "/wallet" },
  { label: "Futures", icon: <TimelineIcon />, route: "/futures" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.route === location.pathname);
    setValue(currentIndex !== -1 ? currentIndex : 0);
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(navItems[newValue].route);
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 2000,
        width: "98vw",
        maxWidth: 500,
        borderRadius: 3,
        boxShadow: 8,
        bgcolor: "#161d2c",
        display: "flex",
        justifyContent: "center"
      }}
      elevation={8}
      aria-label="bottom navigation"
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{ width: "100%", bgcolor: "#161d2c" }}
      >
        {navItems.map(item => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            icon={item.icon}
            sx={{ color: "#fff" }}
            aria-label={item.label}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}