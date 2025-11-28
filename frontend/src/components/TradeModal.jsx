import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Alert, Box
} from "@mui/material";

/**
 * TradeModal
 * - Controlled modal used by Trade pages and Admin tools to create a spot trade.
 * - onTrade: async function({ pair, type, amount, price }) -> should call API and return result.
 * - coins: array of coin objects { symbol, name, price }
 * - wallets: array of user wallets to validate balances before submission.
 */
export default function TradeModal({ open, onClose, coins = [], onTrade, wallets = [] }) {
  const [selectedCoin, setSelectedCoin] = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && coins.length) setSelectedCoin(prev => prev || coins[0].symbol);
    if (!open) {
      setAmount("");
      setAlert("");
      setSubmitting(false);
    }
  }, [open, coins]);

  const guardValidation = () => {
    setAlert("");
    if (!selectedCoin) return "Select a coin.";
    if (!amount || isNaN(amount) || Number(amount) <= 0) return "Enter a positive amount.";
    const coinObj = coins.find(c => c.symbol === selectedCoin);
    if (!coinObj) return "Selected coin not available.";
    if (tradeType === "buy") {
      const usdt = wallets.find(w => (w.coin || "").toUpperCase() === "USDT");
      const price = Number(coinObj.price ?? coinObj.current_price ?? 0);
      if (!usdt || usdt.balance < Number(amount) * price) return "Insufficient USDT balance.";
    } else {
      const coinWallet = wallets.find(w => (w.coin || "").toUpperCase() === selectedCoin.toUpperCase());
      if (!coinWallet || coinWallet.balance < Number(amount)) return `Insufficient ${selectedCoin} balance.`;
    }
    return null;
  };

  const handleTrade = async () => {
    const err = guardValidation();
    if (err) { setAlert(err); return; }
    const coinObj = coins.find(c => c.symbol === selectedCoin);
    const price = Number(coinObj.price ?? coinObj.current_price ?? 0);
    const payload = {
      pair: `${selectedCoin}/USDT`,
      type: tradeType,
      amount: Number(amount),
      price
    };
    setSubmitting(true);
    try {
      await onTrade(payload);
      setAlert("Trade executed successfully.");
      setAmount("");
      // small success delay to show message then close
      setTimeout(() => {
        setSubmitting(false);
        onClose();
      }, 700);
    } catch (e) {
      setSubmitting(false);
      setAlert(typeof e === "string" ? e : (e?.message || "Trade failed"));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Spot Trade</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
          <TextField
            select
            label="Coin"
            value={selectedCoin}
            onChange={e => setSelectedCoin(e.target.value)}
            sx={{ minWidth: 120, flex: 1 }}
            required
          >
            {coins.map(c => (
              <MenuItem key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type"
            value={tradeType}
            onChange={e => setTradeType(e.target.value)}
            sx={{ minWidth: 100, flex: 1 }}
          >
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </TextField>

          <TextField
            label={tradeType === "buy" ? "Amount (USDT)" : `Amount (${selectedCoin || "COIN"})`}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            sx={{ minWidth: 160, flex: 2 }}
            required
          />
        </Box>

        {alert && <Alert severity="error" sx={{ mt: 2 }}>{alert}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleTrade} disabled={submitting}>
          {submitting ? "Processing..." : "Trade"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}