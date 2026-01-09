import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminPanelUI from "./AdminPanelUI";
import { getMe } from "../api";

/**
 * AdminPanel wrapper:
 * - Verifies the current user is admin (uses /user/me)
 * - If authorized, renders the full AdminPanelUI
 * - If not authorized, redirects to login or home
 */
export default function AdminPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await getMe();
        const user = res.data?.user || res.data?.data || res.data;
        const role = user?.role;
        if (role !== "admin") {
          navigate("/");
          return;
        }
        if (mounted) setReady(true);
      } catch (err) {
        try { localStorage.removeItem("token"); } catch {}
        navigate("/login");
      }
    };
    check();
    return () => { mounted = false; };
  }, [navigate]);

  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AdminPanelUI />;
}