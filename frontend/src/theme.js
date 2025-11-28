import { createTheme } from "@mui/material/styles";

const darkBg = "#111418";
const darkPaper = "#181d28";
const darkDivider = "#232c3c";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1890ff" },
    secondary: { main: "#10B981" },
    background: { default: darkBg, paper: darkPaper },
    text: { primary: "#fff", secondary: "#9ca3af" },
    divider: darkDivider,
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
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: darkPaper,
          boxShadow: "0 4px 32px #0003",
          border: "none !important",
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
          borderBottom: `1px solid ${darkDivider}`,
        },
        head: {
          borderBottom: `1px solid ${darkDivider}`,
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: darkDivider
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: darkPaper,
          border: "none !important",
          boxShadow: "0 8px 32px #000a"
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
          borderRadius: 12,
          "& fieldset": {
            borderColor: darkDivider,
          },
          "&:hover fieldset": {
            borderColor: "#1890ff",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#1890ff",
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

export default theme;