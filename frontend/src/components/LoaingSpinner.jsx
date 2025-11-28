import React from "react";
import { CircularProgress, Box } from "@mui/material";
export default function LoadingSpinner() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 200 }}>
      <CircularProgress color="primary" aria-label="loading spinner" />
    </Box>
  );
}