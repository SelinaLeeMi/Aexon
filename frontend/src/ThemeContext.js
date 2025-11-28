import React, { createContext, useContext, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "./theme";

const ThemeContext = createContext();

export function ThemeProviderCustom({ children }) {
  const [themeMode, setThemeMode] = useState(() =>
    localStorage.getItem("themeMode") || "dark"
  );

  React.useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  const customTheme = createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      mode: themeMode,
      background: {
        default: themeMode === "dark" ? "#10192b" : "#20365c",
        paper: themeMode === "dark" ? "#181e2b" : "#26396a",
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      <ThemeProvider theme={customTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}