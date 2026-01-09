import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert
} from "@mui/material";
import { adminPriceOverride } from "../api";

/**
 * CoinEditModal - used primarily to edit coin price (admin override).
 * Keeps a familiar UI for coin editing, but when saved it will call the adminPriceOverride
 * endpoint to update the coin price and optionally broadcast.
 *
 * Props:
 * - open: boolean
 * - onClose: fn
 * - coin: { symbol, name, price, icon } (may be undefined for add)
 * - onSave: fn(updatedCoin) - called after successful save to allow parent to refresh list
 */
export default function CoinEditModal({ open, onClose, coin, onSave }) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSymbol(coin?.symbol || "");
    setName(coin?.name || "");
    setPrice(typeof coin?.price === "number" ? String(coin.price) : (coin?.price || ""));
    setIconUrl(coin?.icon || "");
    setError("");
    setSaving(false);
  }, [coin, open]);

  const handleSave = async () => {
    setError("");
    if (!symbol || symbol.length === 0) {
      setError("Symbol is required");
      return;
    }
    if (price === "" || isNaN(Number(price))) {
      setError("Valid price is required");
      return;
    }
    setSaving(true);
    try {
      // Use adminPriceOverride to update price and broadcast
      await adminPriceOverride(symbol.toUpperCase(), Number(price), true);
      if (onSave) {
        onSave({ symbol: symbol.toUpperCase(), name, price: Number(price), icon: iconUrl });
      }
      onClose();
    } catch (e) {
      setError((e?.response?.data?.error) || e?.message || "Failed to save coin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{coin ? `Edit ${coin.symbol}` : "Edit Coin"}</DialogTitle>
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
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
          Note: Saving will set the coin price via admin override and broadcast to clients.
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}