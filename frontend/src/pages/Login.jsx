import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// IMPORTANT: use raw axios here (NO interceptors)
const BACKEND_HOST =
  process.env.REACT_APP_BACKEND_BASE ||
  process.env.REACT_APP_API_BASE ||
  "https://aexon-qedx.onrender.com";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("login");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // --------------------
  // LOGIN (NO api.js)
  // --------------------
  const handleLogin = async () => {
    setError("");
    setInfo("");

    try {
      const res = await axios.post(`${BACKEND_HOST}/api/auth/login`, {
        email,
        password,
      });

      const payload = res?.data || {};
      const token =
        payload.token ||
        payload.accessToken ||
        payload.data?.token ||
        payload.data?.accessToken ||
        null;

      if (!token) {
        throw new Error("Token missing from login response");
      }

      // 🔐 STORE TOKEN (single source of truth)
      localStorage.setItem("token", token);

      console.log("LOGIN TOKEN SAVED:", token); // temporary debug

      // Optional user storage
      if (payload.data?.user) {
        localStorage.setItem("user", JSON.stringify(payload.data.user));
      }

      navigate("/home");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Login failed";

      if (msg.toLowerCase().includes("verify")) {
        setStep("verify");
        setInfo("Please verify your email.");
      } else {
        setError(msg);
      }
    }
  };

  // --------------------
  // VERIFY EMAIL
  // --------------------
  const handleVerify = async () => {
    setError("");
    setInfo("");

    try {
      await axios.post(`${BACKEND_HOST}/api/auth/confirm`, { code });
      setInfo("Email verified. Logging in...");
      setTimeout(handleLogin, 800);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Verification failed"
      );
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

        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="info">{info}</Alert>}

        {step === "login" && (
          <>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" onClick={handleLogin}>
              Login
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            <TextField
              label="Verification Code"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" onClick={handleVerify}>
              Verify Email
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
