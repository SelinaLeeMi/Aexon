import React, { useEffect, useState } from "react";
import {
  Container, Box, Paper, Typography, Avatar, Button, Chip, Divider, CircularProgress
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getCoins } from "../api";

/**
 * Full Coin detail page with 30-day candlestick (via CoinGecko fallback)
 * and larger UX for trading action. Uses getCoins (backend) for price & meta.
 */
export default function CoinDetailPage() {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [ohlcData, setOhlcData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCoinData() {
      setLoading(true);
      setError("");
      try {
        const res = await getCoins();
        const coinsArr = res.data?.data || res.data || [];
        setCoin(coinsArr.find(c => (c.symbol || "").toLowerCase() === coinId.toLowerCase()));
      } catch (e) {
        setError("Failed to fetch coin data.");
      } finally {
        setLoading(false);
      }
    }
    async function fetchOhlc() {
      setChartLoading(true);
      try {
        const cgMap = {
          btc: "bitcoin",
          eth: "ethereum",
          usdt: "tether",
          usdc: "usd-coin",
        };
        const cgId = cgMap[coinId.toLowerCase()] || coinId.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=30`;
        const res = await fetch(url);
        const data = await res.json();
        setOhlcData(Array.isArray(data) ? data.map(([x, o, h, l, c]) => ({ x, y: [o, h, l, c] })) : []);
      } catch (e) {
        setOhlcData([]);
      } finally {
        setChartLoading(false);
      }
    }
    if (coinId) {
      fetchCoinData();
      fetchOhlc();
    }
  }, [coinId]);

  if (loading) return <Container sx={{ py: 8 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ py: 8 }}><Typography color="error">{error}</Typography></Container>;
  if (!coin) return <Container sx={{ py: 8 }}>Coin not found.</Container>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button onClick={() => navigate(-1)} variant="text" startIcon={<ArrowBackIcon />}>Back</Button>
        <Typography variant="h5" fontWeight={700}>
          {coin.name} Details
        </Typography>
      </Box>
      <Paper sx={{ p: 3, bgcolor: "#181e2b" }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={coin.iconUrl || coin.image} sx={{ width: 60, height: 60 }} />
          <Box>
            <Typography variant="h4" fontWeight={700} color="#fff">{coin.name}</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Chip label={(coin.symbol || "").toUpperCase()} size="small" />
              {coin.market_cap_rank && <Chip label={`#${coin.market_cap_rank}`} size="small" />}
              <Typography fontWeight={700} fontSize={24} color="#10B981" ml={2}>
                ${Number(coin.price || coin.current_price || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}
              </Typography>
              <Typography ml={2}
                color={Number(coin.price_change_percentage_24h) > 0 ? "#10B981" : "#F43F5E"}
                fontWeight={700} fontSize={18}>
                {Number(coin.price_change_percentage_24h) > 0 ? "+" : ""}
                {Number(coin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 3, borderColor: "#232d43" }} />
        <Typography color="#fff" fontWeight={700} mb={2}>Candlestick Chart (30d)</Typography>
        {chartLoading ? (
          <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : ohlcData.length > 0 ? (
          <ReactApexChart
            type="candlestick"
            height={360}
            series={[{ data: ohlcData }]}
            options={{
              chart: { background: "#181e2b", toolbar: { show: true } },
              xaxis: { type: "datetime", labels: { style: { colors: "#fff" } } },
              yaxis: { labels: { style: { colors: "#fff" } } },
              plotOptions: {
                candlestick: {
                  colors: { upward: "#22c55e", downward: "#ef4444" }
                }
              },
              theme: { mode: "dark" }
            }}
          />
        ) : (
          <Typography color="#aaa">Chart data not available.</Typography>
        )}
      </Paper>
    </Container>
  );
}