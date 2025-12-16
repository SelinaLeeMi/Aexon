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

      // Robustly extract token from common response shapes
      const data = res?.data || {};
      let token =
        data.token ||
        data.accessToken ||
        data.auth?.token ||
        data.data?.token ||
        data.data?.accessToken ||
        data.result?.token ||
        null;

      // Some APIs nest under `data` twice (axios wraps) - check that too
      if (!token && data.data && typeof data.data === "object") {
        token = data.data.token || data.data.accessToken || null;
      }

      // If we still don't have a token, attempt to find in headers (rare)
      if (!token) {
        const possible = res?.headers?.authorization || res?.headers?.Authorization || "";
        if (typeof possible === "string" && possible.toLowerCase().startsWith("bearer ")) {
          token = possible.split(" ")[1];
        }
      }

      if (!token) {
        // If no token found, treat as failure (backend should return a token for JWT flows)
        throw new Error("Authentication token not present in response");
      }

      // Store auth under one consistent key
      localStorage.setItem("token", token);

      // Try to extract user object if present in response
      const user =
        data.user ||
        data.data?.user ||
        data.result?.user ||
        (data.userId ? { _id: data.userId } : null) ||
        null;
      if (user) {
        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch (e) {
          // swallow storage errors
        }
      }

      // Navigate to home after token is stored
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