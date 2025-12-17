import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AdminPanelUI from "./AdminPanelUI";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/user/me")
      .then((res) => {
        // ✅ robust role extraction
        const user =
          res.data?.user ||
          res.data?.data ||
          res.data;

        const role = user?.role;

        if (role !== "admin") {
          console.warn("Not admin:", user);
          navigate("/");
          return;
        }

        setReady(true);
      })
      .catch((err) => {
        console.error("Admin auth failed", err);
        localStorage.removeItem("token");
        navigate("/login");
      });
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
