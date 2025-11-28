import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProviderCustom } from "./ThemeContext";
import { NotificationProvider } from "./components/NotificationProvider";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProviderCustom>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </ThemeProviderCustom>
);