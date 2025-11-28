import React, { useEffect, useState } from "react";
import { getCryptoNews } from "../api";
import { Paper, Typography, Box, Link, CircularProgress, Alert } from "@mui/material";

export default function CryptoNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCryptoNews()
      .then(data => {
        setNews(data.data || []);
        setError("");
      })
      .catch(() => setError("Failed to load news"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Latest Crypto News</Typography>
      <Paper sx={{ p: 3 }}>
        {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && news.length === 0 && <Typography>No news found.</Typography>}
        {!loading && !error && news.length > 0 && (
          <Box>
            {news.map((n, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  <Link href={n.url} target="_blank" rel="noopener" color="primary">{n.title}</Link>
                </Typography>
                <Typography color="text.secondary" fontSize={13}>
                  {new Date(n.published_at).toLocaleString()} · {n.source}
                </Typography>
                {n.summary && <Typography fontSize={14}>{n.summary}</Typography>}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}