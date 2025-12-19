import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // 🔐 LOGIN REQUEST
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      /**
       * EXPECTED BACKEND RESPONSE SHAPE:
       * {
       *   success: true,
       *   data: {
       *     token: "JWT_HERE",
       *     user: {...}
       *   }
       * }
       */

      const token = res?.data?.data?.token;
      const user = res?.data?.data?.user;

      if (!token) {
        throw new Error("Login succeeded but token was not returned");
      }

      // ✅ STORE TOKEN (SINGLE SOURCE OF TRUTH)
      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // ✅ CONFIRM STORAGE (for sanity)
      console.log("Token saved:", localStorage.getItem("token"));

      // ✅ GO HOME
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Login failed"
      );
    } finally {
      setLoading(false);
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
      <Paper sx={{ p: 4, minWidth: 360, bgcolor: "#181d28" }}>
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

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 1 }}
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? "Signing in..." : "Login"}
        </Button>
      </Paper>
    </Box>
  );
}
