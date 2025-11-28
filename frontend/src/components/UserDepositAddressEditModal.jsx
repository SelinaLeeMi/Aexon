import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert
} from "@mui/material";
import { adminSetDepositAddress } from "../api";

const supportedNetworks = ["BTC", "ETH", "USDT", "USDC"];

export default function UserDepositAddressEditModal({ open, onClose, user, onSave }) {
  const [depositAddress, setDepositAddress] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDepositAddress(user?.depositAddress || {});
    setError("");
  }, [user, open]);

  const handleDepositAddressChange = (net, value) => {
    setDepositAddress(addr => ({ ...addr, [net]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await adminSetDepositAddress({
        userId: user._id,
        coin: undefined, // To update multiple/all
        address: depositAddress,
      });
      if (onSave) onSave(depositAddress);
      onClose();
    } catch (err) {
      setError("Failed to update deposit addresses");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Deposit Address for {user?.email}</DialogTitle>
      <DialogContent>
        {supportedNetworks.map(net => (
          <TextField
            key={net}
            label={`${net} deposit address`}
            value={depositAddress[net] || ""}
            onChange={e => handleDepositAddressChange(net, e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
        ))}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}