import React, { useState, useEffect } from "react";
import {
  Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, MenuItem, Alert, Box
} from "@mui/material";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function TradePage({ user }) {
  const [coins, setCoins] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [trades, setTrades] = useState([]);

  const [selectedCoin, setSelectedCoin] = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [alert, setAlert] = useState({ type: "", msg: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    API.get("/user/coins", { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      if (res.data && Array.isArray(res.data.data)) {
        setCoins(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCoins(res.data);
      } else {
        setCoins([]);
      }
    });
    API.get("/user/wallet", { headers: { Authorization: `Bearer ${token}` } }).then(res => setWallets(res.data));
    API.get("/trade/my", { headers: { Authorization: `Bearer ${token}` } }).then(res => setTrades(res.data));
  }, [token]);

  const handleTrade = async () => {
    if (!selectedCoin || !amount || isNaN(amount) || Number(amount) <= 0) {
      setAlert({ type: "error", msg: "Select coin and enter a positive amount." });
      return;
    }
    const coinObj = coins.find(c => c.symbol === selectedCoin);
    if (!coinObj) {
      setAlert({ type: "error", msg: "Invalid coin." });
      return;
    }
    if (tradeType === "buy") {
      const usdtWallet = wallets.find(w => w.coin.toLowerCase() === "usdt");
      if (!usdtWallet || usdtWallet.balance < Number(amount)) {
        setAlert({ type: "error", msg: "Not enough USDT balance." });
        return;
      }
    } else {
      const coinWallet = wallets.find(w => w.coin.toLowerCase() === selectedCoin.toLowerCase());
      if (!coinWallet || coinWallet.balance < Number(amount)) {
        setAlert({ type: "error", msg: `Not enough ${selectedCoin.toUpperCase()} balance.` });
        return;
      }
    }
    await API.post("/trade/place", {
      pair: `${selectedCoin}/USDT`,
      type: tradeType,
      amount: Number(amount),
      price: coinObj.price ?? coinObj.current_price
    }, { headers: { Authorization: `Bearer ${token}` } });
    setAlert({ type: "success", msg: "Trade placed!" });
    setAmount("");
    API.get("/user/wallet", { headers: { Authorization: `Bearer ${token}` } }).then(res => setWallets(res.data));
    API.get("/trade/my", { headers: { Authorization: `Bearer ${token}` } }).then(res => setTrades(res.data));
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary">Simulated Spot Trading</Typography>
        {alert.msg && (
          <Alert severity={alert.type} sx={{ mt: 2 }} onClose={() => setAlert({ type: "", msg: "" })}>
            {alert.msg}
          </Alert>
        )}
        <Box sx={{ display: "flex", gap: 2, mt: 3, mb: 2 }}>
          <TextField
            select
            label="Coin"
            value={selectedCoin}
            onChange={e => setSelectedCoin(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {(Array.isArray(coins) ? coins : []).map(c => (
              <MenuItem key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            value={tradeType}
            onChange={e => setTradeType(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </TextField>
          <TextField
            label={tradeType === "buy" ? "Amount (USDT)" : `Amount (${selectedCoin.toUpperCase() || "COIN"})`}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            sx={{ minWidth: 160 }}
          />
          <Button variant="contained" sx={{ minWidth: 120, mt: 1 }} onClick={handleTrade}>Trade</Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 3, color: "#9ca3af" }}>
          Spot trades use real CoinGecko prices, but balances and trades are simulated. No actual crypto is transferred.
        </Typography>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600}>My Trades</Typography>
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Pair</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map(t => (
              <TableRow key={t._id}>
                <TableCell>{t.pair}</TableCell>
                <TableCell>{t.type}</TableCell>
                <TableCell>{t.amount}</TableCell>
                <TableCell>${t.price}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}