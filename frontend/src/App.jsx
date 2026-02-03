import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from "react-router-dom";
import Home from "./pages/Home";
import Market from "./pages/Market";
import CoinDetail from "./pages/CoinDetail";
import CoinDetailPage from "./pages/CoinDetailPage";
import Wallet from "./pages/Wallet";
import Trade from "./pages/Trade";
import Futures from "./pages/Futures";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import BottomNav from "./components/BottomNav";
import TopHeader from "./components/TopHeader";
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, Typography, GlobalStyles } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { NotificationProvider } from "./components/NotificationProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AdminRoute from "./pages/AdminRoute";
import { RealtimeProvider } from "./context/RealtimeContext";

// --- Hardcoded Dark Theme (visual adjustments: softer radius and subtle shadow) ---
const DARK_BG = "#111418";
const DARK_PAPER = "#181d28";
const DARK_DIVIDER = "#232c3c";
const ACCENT_BLUE = "#1890ff";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: ACCENT_BLUE },
    secondary: { main: "#10B981" },
    background: { default: DARK_BG, paper: DARK_PAPER },
    text: { primary: "#fff", secondary: "#9ca3af" },
    divider: DARK_DIVIDER,
    error: { main: "#F43F5E" }
  },
  typography: {
    fontFamily: [
      "Inter",
      "IBM Plex Sans",
      "Roboto",
      "Arial",
      "sans-serif"
    ].join(","),
    fontWeightLight: 400,
    fontWeightRegular: 500,
    fontWeightBold: 700,
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 }
  },
  // Use a moderate border radius (8) to avoid pill shapes
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: DARK_PAPER,
          // Subtle, professional elevation
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          // Use a subtle border instead of heavy shadow to achieve flat, institutional look
          border: `1px solid ${DARK_DIVIDER}`,
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderCollapse: "collapse",
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${DARK_DIVIDER}`,
        },
        head: {
          borderBottom: `1px solid ${DARK_DIVIDER}`,
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: DARK_DIVIDER
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: DARK_PAPER,
          border: `1px solid ${DARK_DIVIDER}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          // Match global moderate radius
          borderRadius: 8,
          "& fieldset": {
            borderColor: DARK_DIVIDER,
          },
          "&:hover fieldset": {
            borderColor: ACCENT_BLUE,
          },
          "&.Mui-focused fieldset": {
            borderColor: ACCENT_BLUE,
            borderWidth: 2,
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: "none",
          boxShadow: "none",
          border: "none"
        }
      }
    }
  }
});

function AppDrawer({ open, onClose, user }) {
  const navigate = useNavigate();
  const menu = [
    { text: "Home", icon: <HomeIcon />, path: "/home" },
    { text: "Market", icon: <ShowChartIcon />, path: "/market" },
    { text: "Trade", icon: <SwapHorizIcon />, path: "/trade" },
    { text: "Wallet", icon: <AccountBalanceWalletIcon />, path: "/wallet" },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
    { text: "Support", icon: <SupportAgentIcon />, path: "/support" },
    { text: "Logout", icon: <LogoutIcon />, path: "/login" },
  ];
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 260, height: "100%" }}>
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
          }}
        >
          {/* Keep avatar minimal — visual-only: do not show heavy styling */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: DARK_PAPER,
              border: `1px solid ${DARK_DIVIDER}`,
              color: "#fff"
            }}
          >
            {/* Minimal icon instead of decorative avatar */}
            <PersonIcon />
          </Box>

          <Box>
            <Typography fontWeight={600} sx={{ color: "#fff" }}>
              {user?.username || "User"}
            </Typography>
            <Typography fontSize={12} color="#bfcfed">
              {user?.email}
            </Typography>
          </Box>
          <IconButton
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              color: "#fff",
            }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {menu.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                onClose();
                navigate(item.path);
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  color: "#fff",
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  let userRaw = localStorage.getItem("user");
  let user = {};
  let token = localStorage.getItem("token");
  try {
    if (userRaw && userRaw !== "undefined") user = JSON.parse(userRaw);
  } catch (e) {
    user = {};
  }

  const ADMIN_ROUTE_PATH = "/super-0xA35-panel";

  const hideNavRoutes = [
    "/",           // landing
    "/login",
    "/register",
    "/forgot-password",
    ADMIN_ROUTE_PATH,
  ];

  const hideGlobalNav = hideNavRoutes.includes(location.pathname);

  // Redirect logic: if logged in and on "/", show dashboard
  if (token && location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  // Header height compensation (prevent page content from being obscured)
  const headerHeight = hideGlobalNav ? 0 : 64; // px

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <GlobalStyles styles={{
        "html, body, #root": {
          backgroundColor: DARK_BG,
          minHeight: "100vh",
          minWidth: "100vw",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
        },
        body: {
          backgroundColor: DARK_BG,
        },
        // Use subtle Paper styling app-wide (no heavy glows)
        '.MuiPaper-root': {
          backgroundColor: DARK_PAPER,
          border: `1px solid ${DARK_DIVIDER}`,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        },
        '.MuiTable-root': {
          backgroundColor: "transparent",
        },
        '.MuiDrawer-paper': {
          backgroundColor: DARK_PAPER,
          color: "#fff",
        },
      }} />

      {/* Global TopHeader (render once) */}
      {!hideGlobalNav && (
        <TopHeader
          onToggleSidebar={() => setDrawerOpen(true)}
          onTrade={() => navigate("/trade")}
          onWallet={() => navigate("/wallet")}
        />
      )}

      {/* Global drawer (controlled by header) */}
      {!hideGlobalNav && (
        <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
      )}

      {/* Main content wrapper with top padding to compensate for the global header */}
      <Box sx={{ pt: `${headerHeight}px` }}>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/home" replace /> : <Landing />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/market" element={<Market />} />
          <Route path="/market/:coinId" element={<CoinDetail />} />
          <Route path="/coin/:coinId" element={<CoinDetailPage />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/futures" element={<Futures />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<Settings />} />
          <Route element={<AdminRoute />}>
            <Route path={ADMIN_ROUTE_PATH} element={<AdminPanel />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </Box>

      {/* Global BottomNav (render once) */}
      {!hideGlobalNav && <BottomNav />}
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <RealtimeProvider enabled={true} pollInterval={5000}>
        <NotificationProvider>
          <ErrorBoundary>
            <Router>
              <AppContent />
            </Router>
          </ErrorBoundary>
        </NotificationProvider>
      </RealtimeProvider>
    </ThemeProvider>
  );
}