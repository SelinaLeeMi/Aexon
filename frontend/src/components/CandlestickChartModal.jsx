import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, CircularProgress, Box, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";

/**
 * CandlestickChartModal
 * - Fetches OHLC from CoinGecko as fallback, but will use provided series prop if supplied.
 * - Props: open, onClose, coin (object with id/symbol/name), series (optional precomputed OHLC series)
 */
export default function CandlestickChartModal({ open, onClose, coin, series: externalSeries = null }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (externalSeries && externalSeries.length) {
      setChartData(externalSeries);
      return;
    }
    if (coin?.id) {
      setLoading(true);
      fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/ohlc?vs_currency=usd&days=30`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) {
            setError("No chart data");
            setChartData([]);
            return;
          }
          setChartData(data.map(([time, open, high, low, close]) => ({
            x: new Date(time),
            y: [open, high, low, close]
          })));
        })
        .catch(() => setError("Failed to load chart data"))
        .finally(() => setLoading(false));
    } else {
      setError("Coin not specified");
    }
  }, [open, coin, externalSeries]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-label="candlestick chart modal">
      <DialogTitle sx={{ background: "#14213d", color: "#ff9800" }}>
        {coin?.name || "Coin"} Candlestick Chart (30d)
      </DialogTitle>
      <DialogContent sx={{ background: "#10192b" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 3 }}>{error}</Typography>
        ) : chartData.length ? (
          <ReactApexChart
            options={{
              chart: { type: "candlestick", background: "#10192b", toolbar: { show: true } },
              theme: { mode: "dark" },
              xaxis: { type: "datetime", labels: { style: { colors: "#ff9800" } } },
              yaxis: { labels: { style: { colors: "#ff9800" } } },
              plotOptions: { candlestick: { colors: { upward: "#24c98d", downward: "#ff9800" } } },
              grid: { borderColor: "#222" }
            }}
            series={[{ data: chartData }]}
            type="candlestick"
            height={420}
          />
        ) : (
          <Typography color="text.secondary" sx={{ p: 3 }}>No chart data available.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}