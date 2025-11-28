import React, { createContext, useContext, useState, useEffect } from "react";

// Persist theme to localStorage for user preference
const ThemeContext = createContext();

export function ThemeProviderCustom({ children }) {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("themeMode") || "dark");
  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);
  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}