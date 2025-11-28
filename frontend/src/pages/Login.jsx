import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("login"); // "login", "verify"
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [userId, setUserId] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      const code = err.response?.data?.code || "";
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Login failed.";
      if (
        code === "EMAIL_NOT_VERIFIED" ||
        (typeof msg === "string" && msg.toLowerCase().includes("verify"))
      ) {
        navigate("/register", { state: { email } });
        return;
      } else {
        setError(typeof msg === "string" ? msg : "Login failed.");
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    try {
      await api.post("/auth/confirm", { userId, code });
      setInfo("Email verified! Logging you in...");
      setTimeout(() => handleLogin(e), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Verification failed.";
      setError(typeof msg === "string" ? msg : "Verification failed.");
    }
  };

  const resendCode = async () => {
    setError(""); setInfo("");
    try {
      await api.post("/auth/register", {
        email,
        password,
      });
      setInfo("Verification code sent. Please check your email.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to resend code.";
      setError(typeof msg === "string" ? msg : "Failed to resend code.");
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
            {typeof error === "string" ? error : error?.message || JSON.stringify(error)}
          </Alert>
        )}
        {info && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}
        {step === "login" && (
          <form onSubmit={handleLogin}>
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
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 1 }}>
              Login
            </Button>
            <Button
              fullWidth
              variant="text"
              sx={{ mt: 1 }}
              onClick={() => navigate("/register")}
            >
              Create an account
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}