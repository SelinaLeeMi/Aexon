import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Make sure these PNG/SVGs exist in public/assets/coins/
const hotList = [
  { name: "BTC", sub: "BTCUSDT", price: 114603.0, change: 0.09, icon: "/assets/coins/btc.png" },
  { name: "ETH", sub: "ETHUSDT", price: 3691.93, change: 1.0, icon: "/assets/coins/eth.png" },
  { name: "USDC", sub: "USDCUSDT", price: 0.999, change: -0.07, icon: "/assets/coins/usdc.png" },
  { name: "SOL", sub: "SOLUSDT", price: 169.01, change: 1.31, icon: "/assets/coins/sol.png" },
  { name: "XRP", sub: "XRPUSDT", price: 2.9985, change: 1.06, icon: "/assets/coins/xrp.png" },
  { name: "FLU", sub: "FLUUSDT", price: 140.611, change: -0.94, icon: "/assets/coins/flu.png" },
];
const gainerList = [
  { name: "BRY", sub: "BRYUSDT", price: 129.38, change: 4.87, icon: "/assets/coins/bry.png" },
  { name: "ORP", sub: "ORPUSDT", price: 3.51244, change: 3.55, icon: "/assets/coins/orp.png" },
  { name: "EYC", sub: "EYCUSDT", price: 26.847, change: 3.51, icon: "/assets/coins/eyc.png" },
  { name: "BZT", sub: "BZTUSDT", price: 4.6376, change: 2.5, icon: "/assets/coins/bzt.png" },
  { name: "IMX", sub: "IMXUSDT", price: 0.5185, change: 2.13, icon: "/assets/coins/imx.png" },
  { name: "DFC", sub: "DFCUSDT", price: 49.29755, change: 2.09, icon: "/assets/coins/dfc.png" },
];
const loserList = [
  { name: "FLU", sub: "FLUUSDT", price: 140.622, change: -0.94, icon: "/assets/coins/flu.png" },
  { name: "Crude", sub: "USOUSD", price: 64.091, change: -0.4, icon: "/assets/coins/crude.png" },
  { name: "NAP", sub: "NAPUSDT", price: 120.49446, change: -0.36, icon: "/assets/coins/nap.png" },
];

const CoinIcon = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: 28,
      height: 28,
      marginRight: 10,
      borderRadius: 6, // slightly rounded squares (was 50%)
      background: "#222", // fallback background if image missing
      objectFit: "contain",
      display: "block"
    }}
    onError={e => {
      e.target.onerror = null;
      e.target.src = "/assets/coins/default.png"; // fallback icon (ensure exists)
    }}
  />
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        bgcolor: "#111418",
        background: "#0B0F14",
        flexDirection: "column",
        alignItems: "center",
        m: 0,
        p: 0,
        overflowX: "hidden",
      }}
    >
      {/* Top right login/register */}
      <Box sx={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        px: 5,
        pt: 4,
        gap: 2,
        position: "absolute",
        top: 0,
        right: 0,
        zIndex: 2
      }}>
        <Button
          variant="text"
          size="medium"
          sx={{
            color: "#fff",
            fontWeight: 700,
            textTransform: "none",
            mx: 1,
            "&:hover": { color: "#1890ff", background: "none" },
          }}
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
        <Button
          variant="contained"
          size="medium"
          sx={{
            color: "#000",
            fontWeight: 700,
            background: "#fff",
            borderRadius: 2,
            textTransform: "none",
            mx: 1,
            "&:hover": { background: "#1890ff", color: "#fff" },
          }}
          onClick={() => navigate("/register")}
        >
          Register
        </Button>
      </Box>

      {/* Main logo and exchange name */}
      <Box sx={{ mt: 10, mb: 2, textAlign: "center" }}>
        <img
          src="/assets/aexon-logo.png"
          alt="Aexon Exchange"
          style={{
            width: 64,
            height: 64,
            borderRadius: 8, // smaller, professional radius
            marginBottom: 8,
            objectFit: "contain",
            background: "#181d28"
          }}
        />
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: "#1890ff", letterSpacing: 0.5, mt: 1 }}
        >
          Aexon Exchange
        </Typography>
      </Box>

      {/* Hot List */}
      <Paper
        sx={{
          bgcolor: "#181d28",
          width: "100%",
          maxWidth: 420,
          mx: "auto",
          my: 2,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #232c3c",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
        elevation={0}
      >
        <Typography fontWeight={700} color="#10B981" fontSize={20} mb={1}>
          <span style={{
            borderLeft: "4px solid #10B981",
            paddingLeft: 10,
            fontSize: 18
          }}>Hot List</span>
        </Typography>
        {hotList.map((item, idx) => (
          <Box
            key={item.name}
            sx={{
              display: "flex", alignItems: "center", py: 1,
              borderBottom: idx === hotList.length - 1 ? "none" : "1px solid #232c3c",
            }}
          >
            <CoinIcon src={item.icon} alt={item.name} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={700} color="#fff" fontSize={16}>
                {item.name}
              </Typography>
              <Typography fontWeight={500} color="#bbb" fontSize={12}>
                {item.sub}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 90, textAlign: "right" }}>
              <Typography fontWeight={700} color="#fff" fontSize={15}>
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </Typography>
              <Typography
                fontWeight={700}
                fontSize={14}
                color={item.change >= 0 ? "#10B981" : "#F43F5E"}
              >
                {item.change > 0 ? "+" : ""}
                {item.change.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Gainer List */}
      <Paper
        sx={{
          bgcolor: "#181d28",
          width: "100%",
          maxWidth: 420,
          mx: "auto",
          my: 2,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #232c3c",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
        elevation={0}
      >
        <Typography fontWeight={700} color="#10B981" fontSize={20} mb={1}>
          <span style={{
            borderLeft: "4px solid #10B981",
            paddingLeft: 10,
            fontSize: 18
          }}>Gainer List</span>
        </Typography>
        {gainerList.map((item, idx) => (
          <Box
            key={item.name}
            sx={{
              display: "flex", alignItems: "center", py: 1,
              borderBottom: idx === gainerList.length - 1 ? "none" : "1px solid #232c3c",
            }}
          >
            <CoinIcon src={item.icon} alt={item.name} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={700} color="#fff" fontSize={16}>
                {item.name}
              </Typography>
              <Typography fontWeight={500} color="#bbb" fontSize={12}>
                {item.sub}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 90, textAlign: "right" }}>
              <Typography fontWeight={700} color="#fff" fontSize={15}>
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </Typography>
              <Typography
                fontWeight={700}
                fontSize={14}
                color="#10B981"
              >
                +{item.change.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Loser List */}
      <Paper
        sx={{
          bgcolor: "#181d28",
          width: "100%",
          maxWidth: 420,
          mx: "auto",
          my: 2,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #232c3c",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
        elevation={0}
      >
        <Typography fontWeight={700} color="#F43F5E" fontSize={20} mb={1}>
          <span style={{
            borderLeft: "4px solid #F43F5E",
            paddingLeft: 10,
            fontSize: 18
          }}>Loser List</span>
        </Typography>
        {loserList.map((item, idx) => (
          <Box
            key={item.name}
            sx={{
              display: "flex", alignItems: "center", py: 1,
              borderBottom: idx === loserList.length - 1 ? "none" : "1px solid #232c3c",
            }}
          >
            <CoinIcon src={item.icon} alt={item.name} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={700} color="#fff" fontSize={16}>
                {item.name}
              </Typography>
              <Typography fontWeight={500} color="#bbb" fontSize={12}>
                {item.sub}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 90, textAlign: "right" }}>
              <Typography fontWeight={700} color="#fff" fontSize={15}>
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </Typography>
              <Typography
                fontWeight={700}
                fontSize={14}
                color="#F43F5E"
              >
                {item.change.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Footer */}
      <Box sx={{ textAlign: "center", mt: 4, mb: 3, color: "#bfcfed", fontSize: 15 }}>
        © 2025 Aexon Exchange. All rights reserved. | <a
          href="/README.md"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1890ff", textDecoration: "underline", marginLeft: 4 }}
        >
          README
        </a>
      </Box>
    </Box>
  );
}