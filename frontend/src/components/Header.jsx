import React from "react";
import { Box, Typography } from "@mui/material";

export default function Header({ center = false, mini = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
        gap: 2,
        mb: mini ? 1 : 3,
        mt: mini ? 0 : 2,
      }}
      aria-label="logo header"
    >
      <img
        src="/assets/aexon-logo.png"
        alt="Aexon Logo"
        style={{
          height: mini ? "40px" : "60px",
          borderRadius: "12px",
          boxShadow: "0 1px 8px #2228",
          objectFit: "contain",
        }}
      />
      <Typography
        variant={mini ? "h6" : "h4"}
        fontWeight={700}
        color="primary"
        sx={{ letterSpacing: 1, textShadow: "0 1px 8px #2228" }}
      >
        Aexon Exchange
      </Typography>
    </Box>
  );
}