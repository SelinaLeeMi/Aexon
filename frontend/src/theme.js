// Design theme tokens and MUI theme configuration
import { createTheme } from "@mui/material/styles";

/**
 * Design tokens and theme for the application.
 * Mobile-first typography and spacing are applied.
 *
 * Usage:
 * import Theme from './theme';
 * <ThemeProvider theme={Theme}>...</ThemeProvider>
 */

const baseTypography = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: {
    fontSize: "1.5rem", // 24px mobile
    fontWeight: 700,
  },
  h2: {
    fontSize: "1.125rem", // 18px
    fontWeight: 700,
  },
  h3: {
    fontSize: "1rem", // 16px
    fontWeight: 600,
  },
  body1: {
    fontSize: "0.9375rem", // 15px
    fontWeight: 400,
  },
  body2: {
    fontSize: "0.875rem", // 14px
    fontWeight: 400,
  },
  caption: {
    fontSize: "0.75rem", // 12px
  },
  // Use tabular numbers for monetary values where applied in styles
};

const Theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB", // blue 600
      contrastText: "#ffffff",
    },
    success: {
      main: "#16A34A",
      contrastText: "#ffffff",
    },
    error: {
      main: "#DC2626",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F6F7F9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F1724",
      secondary: "#6B7280",
    },
    divider: "rgba(15, 23, 36, 0.06)",
  },
  shape: {
    borderRadius: 8, // --radius-md
  },
  spacing: 8, // base spacing unit
  typography: {
    ...baseTypography,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid rgba(15,23,36,0.04)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(15,23,36,0.04)",
        },
      },
    },
  },
});

export default Theme;