import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert
} from "@mui/material";

const supportedNetworks = ["BTC", "ETH", "USDT", "USDC"];

export default function CoinEditModal({ open, onClose, coin, onSave }) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [depositAddress, setDepositAddress] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    setSymbol(coin?.symbol || "");
    setName(coin?.name || "");
    setPrice(coin?.price || "");
    setIconUrl(coin?.iconUrl || "");
    setDepositAddress(coin?.depositAddress || {});
    setError("");
  }, [coin, open]);

  const handleDepositAddressChange = (net, value) => {
    setDepositAddress(addr => ({ ...addr, [net]: value }));
  };

  const handleSave = () => {
    setError("");
    if (!symbol || !name || !price || isNaN(price) || Number(price) <= 0) {
      setError("Fill all required fields correctly.");
      return;
    }
    onSave({
      symbol,
      name,
      price: Number(price),
      iconUrl,
      depositAddress
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{coin ? "Edit Coin" : "Add Coin"}</DialogTitle>
      <DialogContent>
        <TextField
          label="Symbol"
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          sx={{ mb: 2 }}
          disabled={!!coin}
          fullWidth
          required
        />
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
          required
        />
        <TextField
          label="Price (USD)"
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
          required
        />
        <TextField
          label="Icon URL"
          value={iconUrl}
          onChange={e => setIconUrl(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        {supportedNetworks.map(net => (
          <TextField
            key={net}
            label={`Default deposit address for ${net}`}
            value={depositAddress[net] || ""}
            onChange={e => handleDepositAddressChange(net, e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
        ))}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSave}>Save</Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}