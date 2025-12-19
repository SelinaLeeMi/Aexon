import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ EXACT backend response shape
      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token) {
        throw new Error("Token missing from login response");
      }

      // ✅ Store token in ONE place only
      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // ✅ Navigate AFTER storage
      navigate("/home");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Login failed";
      setError(msg);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#111418",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4, minWidth: 340, bgcolor: "#181d28" }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Sign In to Aexon
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={handleLogin}>
          Login
        </Button>
      </Paper>
    </Box>
  );
}
