import React, { useEffect, useState } from "react";
import { getAnnouncements } from "../api";
import { Paper, Typography, Box, CircularProgress, Alert } from "@mui/material";

export default function Announcements() {
  const [anns, setAnns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnnouncements()
      .then(data => {
        setAnns(Array.isArray(data.announcements) ? data.announcements : []);
        setError("");
      })
      .catch(e => setError(typeof e === "string" ? e : e?.message || "Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Announcements</Typography>
      {loading && <CircularProgress sx={{ my: 3 }} />}
      {error && <Alert severity="error">{typeof error === "string" ? error : error?.message || JSON.stringify(error)}</Alert>}
      <Box>
        {!loading && !error && anns.map((a, i) => (
          <Box key={i} sx={{ mb: 3, borderLeft: a.pinned ? "4px solid #10B981" : "none", pl: a.pinned ? 2 : 0 }}>
            <Typography fontWeight={700}>{a.title}</Typography>
            <Typography>{a.message}</Typography>
            <Typography fontSize={12} color="text.secondary">
              {new Date(a.createdAt).toLocaleString()} by {a.createdBy?.email || "Admin"}
            </Typography>
          </Box>
        ))}
        {!loading && !error && anns.length === 0 && (
          <Typography>No announcements yet.</Typography>
        )}
      </Box>
    </Paper>
  );
}