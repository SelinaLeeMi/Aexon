import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Box, Button } from "@mui/material";
import Header from "./Header";

export default function NavBar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2 }}>
      <Toolbar sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Header mini />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
          <Button color="inherit" component={Link} to="/market">Market</Button>
          <Button color="inherit" component={Link} to="/wallet">Wallet</Button>
          <Button color="inherit" component={Link} to="/trade">Trade</Button>
          <Button color="inherit" component={Link} to="/futures">Futures</Button>
          <Button color="inherit" component={Link} to="/profile">Profile</Button>
          <Button color="inherit" component={Link} to="/support">Support</Button>
          <Button color="inherit" component={Link} to="/settings">Settings</Button>
          {user.role === "admin" && (
            <Button color="inherit" component={Link} to="/admin">Admin</Button>
          )}
          {user.email
            ? <Button color="error" onClick={handleLogout}>Logout</Button>
            : <Button color="inherit" component={Link} to="/login">Login</Button>
          }
        </Box>
      </Toolbar>
    </AppBar>
  );
}