import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Alert, Box
} from "@mui/material";

/**
 * DepositWithdrawModal
 * - Generic modal used for deposit or withdraw request creation.
 * - type: 'deposit' | 'withdraw'
 * - coins: [{ symbol, name }]
 * - onSubmit: async({ coin, amount, address }) -> creates request via API
 */
export default function DepositWithdrawModal({ open, onClose, coins = [], type = "deposit", onSubmit }) {
  const [selectedCoin, setSelectedCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCoin(coins[0]?.symbol || "");
      setAmount("");
      setAddress("");
      setAlert("");
    }
  }, [open, coins]);

  const handleAction = async () => {
    setAlert("");
    if (!selectedCoin || !amount || Number(amount) <= 0) {
      setAlert("Fill all fields correctly.");
      return;
    }
    if (type === "withdraw" && !address) {
      setAlert("Recipient address required for withdrawal.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        coin: selectedCoin,
        amount: Number(amount),
        address: type === "deposit" ? undefined : address
      });
      setSubmitting(false);
      onClose();
    } catch (e) {
      setSubmitting(false);
      setAlert(typeof e === "string" ? e : (e?.message || "Request failed"));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{type === "deposit" ? "Deposit Request" : "Withdraw Request"}</DialogTitle>
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
            label="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            sx={{ minWidth: 120, flex: 1 }}
            required
          />
          {type === "withdraw" && (
            <TextField
              label="Recipient Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              sx={{ minWidth: 180, flex: 2 }}
              required
            />
          )}
        </Box>
        {alert && <Alert severity="error" sx={{ mt: 2 }}>{alert}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleAction} disabled={submitting}>
          {submitting ? "Submitting..." : (type === "deposit" ? "Request Deposit" : "Request Withdraw")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}