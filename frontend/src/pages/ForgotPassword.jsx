import React, { useState } from "react";
import { forgotPassword } from "../api";
import { Link } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Alert, GlobalStyles
} from "@mui/material";
import Header from "../components/Header";

const NAVY_BG = "#20365C";
const NAVY_CARD = "#25355a";
const NAVY_OUTLINE = "#354469";
const NAVY_LABEL = "#9ca3af";
const NAVY_LABEL_FOCUS = "#1890ff";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const textFieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "transparent",
      borderRadius: "18px"
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: `${NAVY_OUTLINE} !important`,
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

  async function handleForgot(e) {
    e.preventDefault();
    setMsg("");
    try {
      await forgotPassword({ email });
      setMsg("If this email is registered, you'll receive a reset link.");
    } catch (error) {
      setMsg(error.response?.data?.message || "Error requesting reset.");
    }
  }

  return (
    <>
      <GlobalStyles styles={{}} />
      <Box sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: NAVY_BG
      }}>
        <Paper sx={{
          p: 4,
          borderRadius: 4,
          bgcolor: NAVY_CARD,
          boxShadow: "0 8px 24px #10192b50",
          maxWidth: 350,
          width: "96vw",
          mx: "auto"
        }}>
          <Header center mini />
          <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
            Forgot Password
          </Typography>
          <form onSubmit={handleForgot}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth sx={textFieldSx}
              autoFocus
              required
            />
            <Button variant="contained" fullWidth type="submit" sx={{ mt: 1, borderRadius: 2 }}>
              Send Reset Link
            </Button>
            {msg && <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>{msg}</Alert>}
          </form>
          <Box mt={3} textAlign="center">
            <Link to="/login" style={{ color: "#1890ff", textDecoration: "none" }}>Back to login</Link>
          </Box>
        </Paper>
      </Box>
    </>
  );
}