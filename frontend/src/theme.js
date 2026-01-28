// Design theme tokens and MUI theme configuration
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

/**
 * Design tokens and theme for the application.
 * Mobile-first typography and spacing are applied.
 *
 * Usage:
 * import Theme from './theme';
 * <ThemeProvider theme={Theme}>...</ThemeProvider>
 */

/**
 * Load Inter from Google Fonts in a clean, runtime-safe way.
 * This is a non-invasive runtime side-effect that appends a link tag
 * when the module is imported in the browser.
 */
if (typeof document !== "undefined") {
  const id = "gf-inter";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
  }
}

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
    lineHeight: 1.2,
  },
  h2: {
    fontSize: "1.125rem", // 18px
    fontWeight: 700,
  },
  h3: {
    fontSize: "1rem", // 16px
    fontWeight: 600,
  },
  h4: {
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  h5: {
    fontSize: "0.875rem",
    fontWeight: 700,
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
    color: "rgba(15, 23, 36, 0.6)",
  },
  button: {
    fontWeight: 600,
  },
  // Use tabular numbers for monetary values where applied in styles (components can set fontVariantNumeric)
};

let Theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB", // blue 600 (requested)
      contrastText: "#ffffff",
    },
    success: {
      main: "#16A34A", // green used only for positive % changes
      contrastText: "#ffffff",
    },
    error: {
      main: "#DC2626", // red used only for negative % changes
      contrastText: "#ffffff",
    },
    background: {
      default: "#F6F7F9", // page background (soft)
      paper: "#FFFFFF", // card / surface
    },
    text: {
      primary: "#0F1724", // dark slate
      secondary: "#6B7280", // muted
    },
    divider: "rgba(15, 23, 36, 0.06)",
    action: {
      hover: "rgba(37,99,235,0.06)",
      selected: "rgba(37,99,235,0.04)",
    },
  },
  shape: {
    borderRadius: 10, // softer rounded corners
  },
  spacing: 8, // base spacing unit
  typography: {
    ...baseTypography,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F6F7F9",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          // default card-like paper look (light, subtle border and shadow)
          backgroundClip: "padding-box",
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "0 1px 6px rgba(12,18,25,0.04)",
          border: "1px solid rgba(15,23,36,0.04)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
        },
      },
    },
  },
});

// Apply responsive font-sizes for better mobile-first typography scaling
Theme = responsiveFontSizes(Theme);

export default Theme;