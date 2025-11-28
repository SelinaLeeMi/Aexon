import React, { useEffect, useState } from "react";
import { getCoins } from "../api";
import ReactApexChart from "react-apexcharts";
import {
  Paper, Typography, Box, Select, MenuItem, TextField, Button, Grid, Alert
} from "@mui/material";

/**
 * Futures simplified UI:
 * - Local simulation of opening/closing positions.
 * - Uses backend coin list for price reference, but positions are simulated client-side (you may later persist on backend).
 */
export default function Futures() {
  const [coin, setCoin] = useState("BTC");
  const [coins, setCoins] = useState([]);
  const [ohlc, setOhlc] = useState([]);
  const [type, setType] = useState("long");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [entryPrice, setEntryPrice] = useState(0);
  const [msg, setMsg] = useState("");
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    getCoins().then(r => {
      const cs = r.data?.data || r.data || [];
      setCoins(cs);
      const found = cs.find(c => c.symbol === coin);
      setEntryPrice(found ? (found.price ?? found.current_price ?? 0) : 0);
    });
  }, [coin]);

  useEffect(() => {
    // Chart: fetch 1d OHLC for coin from coingecko as fallback
    const cgMap = { BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin" };
    const cgCoin = cgMap[coin.toUpperCase()] || coin.toLowerCase();
    fetch(`https://api.coingecko.com/api/v3/coins/${cgCoin}/ohlc?vs_currency=usd&days=1`)
      .then(res => res.json())
      .then(data => {
        setOhlc(Array.isArray(data) ? data.map(([x, o, h, l, c]) => ({ x, y: [o, h, l, c] })) : []);
      }).catch(() => setOhlc([]));
  }, [coin]);

  const handleOpenPos = () => {
    if (!amount || Number(amount) <= 0 || !leverage || Number(leverage) <= 0) {
      setMsg("Please enter valid amount and leverage");
      return;
    }
    setPositions(prev => [
      {
        id: Date.now().toString(36),
        coin,
        type,
        amount: Number(amount),
        leverage: Number(leverage),
        entry: Number(entryPrice),
        createdAt: new Date().toISOString(),
        status: "open"
      },
      ...prev
    ]);
    setMsg("Position opened");
    setAmount("");
  };

  const handleClosePos = idx => {
    const pos = positions[idx];
    const priceNow = coins.find(c => c.symbol === pos.coin)?.price || pos.entry;
    let pnl = 0;
    if (pos.direction === "long" || pos.type === "long") {
      pnl = ((priceNow - pos.entry) / pos.entry) * pos.amount * pos.leverage;
    } else {
      pnl = ((pos.entry - priceNow) / pos.entry) * pos.amount * pos.leverage;
    }
    setPositions(prev => prev.map((p, i) => i === idx ? ({ ...p, pnl, closed: true, status: "closed", closedAt: new Date().toISOString() }) : p));
    setMsg(`Closed with PnL: ${pnl.toFixed(2)} USDT`);
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight={700}>Futures Trading Pro</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Select value={coin} onChange={e => setCoin(e.target.value)} fullWidth sx={{ mb:2 }}>
              {coins.map(c => (
                <MenuItem key={c.symbol} value={c.symbol}>{c.symbol}</MenuItem>
              ))}
            </Select>
            <Select value={type} onChange={e => setType(e.target.value)} fullWidth sx={{ mb:2 }}>
              <MenuItem value="long">Long</MenuItem>
              <MenuItem value="short">Short</MenuItem>
            </Select>
            <TextField label="Amount (margin USDT)" value={amount} type="number" fullWidth sx={{ mb:2 }} onChange={e=>setAmount(e.target.value)} />
            <TextField label="Leverage" value={leverage} type="number" fullWidth sx={{ mb:2 }} onChange={e=>setLeverage(e.target.value)} />
            <TextField label="Entry Price" value={entryPrice} fullWidth sx={{ mb:2 }} InputProps={{readOnly:true}} />
            <Button variant="contained" fullWidth onClick={handleOpenPos} disabled={!coin||!amount||!leverage}>
              Open Position
            </Button>
            {msg && <Alert severity="info" sx={{mt:2}}>{msg}</Alert>}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontWeight={700} mb={2}>Candlestick Chart (1d)</Typography>
            {ohlc.length > 0 ? (
              <ReactApexChart
                type="candlestick"
                height={320}
                series={[{ data: ohlc }]}
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
              <Typography color="#aaa">Chart not available.</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p:2, mt:3 }}>
        <Typography fontWeight={700}>My Positions</Typography>
        {positions.length === 0 ? (
          <Typography>No open positions</Typography>
        ) : positions.map((pos, idx) => (
          <Box key={pos.id} sx={{mb:2,p:2,bgcolor:"#222",borderRadius:2}}>
            <Typography>
              {pos.type === "long" ? "Long" : "Short"} {pos.coin} | Margin: {pos.amount} USDT | Lev: {pos.leverage}x | Entry: {pos.entry}
            </Typography>
            <Typography>
              {pos.closed
                ? `Final PnL: ${pos.pnl?.toFixed(2) ?? 0} USDT`
                : <Button onClick={() => handleClosePos(idx)}>Close Position</Button>}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}