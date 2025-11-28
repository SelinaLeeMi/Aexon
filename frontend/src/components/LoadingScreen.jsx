import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Header from "./Header";

export default function LoadingScreen({ text = "Loading..." }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        bgcolor: "#181B2A",
        backgroundImage: "url(/assets/bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="loading screen"
    >
      <Header center mini />
      <CircularProgress size={56} sx={{ color: "#1890ff", mb: 3, mt: 3 }} />
      <Typography variant="h6" color="white" fontWeight={500}>
        {text}
      </Typography>
    </Box>
  );
}