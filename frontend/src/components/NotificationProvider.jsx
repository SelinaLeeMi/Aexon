import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  const showNotification = useCallback((message, severity = "info", duration = 4000) => {
    setNotification({ open: true, message, severity });
    setTimeout(() => setNotification(n => ({ ...n, open: false })), duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar open={notification.open} autoHideDuration={4000}>
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}