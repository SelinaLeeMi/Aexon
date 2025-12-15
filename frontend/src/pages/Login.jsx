import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api, { login } from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("login"); // "login" | "verify"
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // --------------------
  // LOGIN
  // --------------------
  const handleLogin = async () => {
    setError("");
    setInfo("");

    try {
      const res = await login(email, password);

      // Store auth
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Go to app
      navigate("/home");
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Login failed";

      // Email not verified flow
      if (
        code === "EMAIL_NOT_VERIFIED" ||
        (typeof msg === "string" && msg.toLowerCase().includes("verify"))
      ) {
        setStep("verify");
        setInfo("Please verify your email to continue.");
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
      await api.post("/auth/confirm", { code });
      setInfo("Email verified! Logging you in...");
      setTimeout(handleLogin, 800);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Verification failed";
      setError(msg);
    }
  };

  // --------------------
  // RESEND CODE
  // --------------------
  const resendCode = async () => {
    setError("");
    setInfo("");

    try {
      await api.post("/auth/register", { email, password });
      setInfo("Verification code resent. Check your email.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to resend code";
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

        {info && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        {/* ---------------- LOGIN STEP ---------------- */}
        {step === "login" && (
          <>
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
              onClick={handleLogin}
            >
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
          </>
        )}

        {/* ---------------- VERIFY STEP ---------------- */}
        {step === "verify" && (
          <>
            <TextField
              label="Verification Code"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1 }}
              onClick={handleVerify}
            >
              Verify Email
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{ mt: 1 }}
              onClick={resendCode}
            >
              Resend Code
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
