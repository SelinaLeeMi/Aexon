import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Alert, IconButton, InputAdornment, CircularProgress
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Header from "../components/Header";

const NAVY_BG = "#20365C";
const NAVY_CARD = "#25355a";
const NAVY_OUTLINE = "#354469";
const NAVY_LABEL = "#9ca3af";
const NAVY_LABEL_FOCUS = "#1890ff";

const textFieldSx = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "transparent",
    borderRadius: "18px"
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: NAVY_OUTLINE + " !important",
    borderWidth: "2px !important",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#1890ff !important"
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#1890ff !important",
    borderWidth: "2px !important"
  },
  "& .MuiInputLabel-root": {
    color: NAVY_LABEL
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: NAVY_LABEL_FOCUS
  }
};

export default function Register() {
  const [step, setStep] = useState(1); // 1: form, 2: code
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const [canRequestCode, setCanRequestCode] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Handle code countdown timer
  const startCountdown = () => {
    setCanRequestCode(false);
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          setCanRequestCode(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Step 1: Register form submit
  async function handleRequestCode(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password: loginPassword,
        referralCode,
      });
      setUserId(res.data.userId || email);
      setStep(2);
      setMsg("");
      startCountdown();
    } catch (error) {
      const code = error.response?.data?.code || "";
      const message = error.response?.data?.message || error.message || "";
      if (code === "EMAIL_NOT_VERIFIED" || message.toLowerCase().includes("not verified")) {
        setUserId(error.response?.data?.userId || email);
        setStep(2);
        setMsg("Your email is not verified. Please enter the code sent to your email.");
        startCountdown();
      }
      else if (code === "EMAIL_ALREADY_REGISTERED" || message.toLowerCase().includes("already registered")) {
        setMsg("This email is already registered and verified. Please log in.");
      }
      else {
        setMsg(message || "Registration failed. Please try again or contact support.");
      }
    }
    setLoading(false);
  }

  // Step 2: Confirm code
  async function handleCodeConfirm(e) {
    e.preventDefault();
    setCodeMsg("");
    setCodeLoading(true);
    try {
      await api.post("/auth/confirm", {
        userId,
        code,
      });
      setCodeMsg("✅ Email verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setCodeMsg(err.response?.data?.message || "Confirmation failed.");
    }
    setCodeLoading(false);
  }

  // Resend code
  async function handleResendCode(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password: loginPassword,
        referralCode,
      });
      setUserId(res.data.userId || email);
      startCountdown();
      setMsg("Verification code resent. Please check your email.");
    } catch (error) {
      setMsg(error.response?.data?.message || "Resending code failed");
    }
    setLoading(false);
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: NAVY_BG
    }}>
      <Paper sx={{
        p: 4,
        borderRadius: "18px",
        bgcolor: NAVY_CARD,
        boxShadow: "0 8px 24px #10192b50",
        maxWidth: 370,
        width: "96vw",
        mx: "auto"
      }}>
        <Header center mini />
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center" color="primary">
          Register for Aexon
        </Typography>
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              required
              sx={textFieldSx}
              disabled={loading}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              fullWidth
              required
              sx={textFieldSx}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(show => !show)}
                      edge="end"
                      sx={{ color: NAVY_LABEL }}
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Referral Code (optional)"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              fullWidth
              sx={textFieldSx}
              disabled={loading}
            />
            <Button variant="contained" fullWidth type="submit" sx={{ mt: 1, borderRadius: 2 }} disabled={loading || !canRequestCode}>
              {loading ? <CircularProgress size={24} /> : "REQUEST CODE"}
            </Button>
            {msg && (
              <Alert severity={msg.startsWith("This email is already registered") ? "warning" : "error"} sx={{ mt: 2, borderRadius: 2 }}>
                {msg}
                {msg.includes("already registered") && (
                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      color="primary"
                      sx={{ borderRadius: 2 }}
                      component={Link}
                      to="/login"
                    >
                      Go to Login
                    </Button>
                  </Box>
                )}
              </Alert>
            )}
            <Box mt={3} textAlign="center">
              <Link to="/login" style={{ color: "#1890ff", textDecoration: "none" }}>Already have an account? Login</Link>
            </Box>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleCodeConfirm}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              We sent a 6-digit code to your email.<br />
              Enter it below to confirm your account.<br />
              <b>(Valid for 10 minutes)</b>
            </Alert>
            <TextField
              label="Confirmation Code"
              value={code}
              onChange={e => setCode(e.target.value)}
              fullWidth
              sx={textFieldSx}
              inputProps={{ maxLength: 6, inputMode: "numeric", pattern: "[0-9]*" }}
              autoFocus
              required
              disabled={codeLoading}
            />
            <Button variant="contained" fullWidth type="submit" sx={{ mt: 1, borderRadius: 2 }} disabled={codeLoading}>
              {codeLoading ? <CircularProgress size={24} /> : "Confirm Email"}
            </Button>
            <Button
              variant="text"
              fullWidth
              sx={{ mt: 1, borderRadius: 2, color: "#1890ff" }}
              disabled={!canRequestCode}
              onClick={handleResendCode}
            >
              {canRequestCode ? "Resend Code" : `Resend in ${countdown}s`}
            </Button>
            {codeMsg && (
              <Alert severity={codeMsg.startsWith("✅") ? "success" : "error"} sx={{ mt: 2, borderRadius: 2 }}>
                {codeMsg}
              </Alert>
            )}
            <Box mt={2} textAlign="center">
              <Button
                variant="text"
                size="small"
                sx={{ color: "#1890ff" }}
                onClick={() => setStep(1)}
                disabled={codeLoading}
              >
                Back to registration
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
}