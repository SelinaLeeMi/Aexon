import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, Typography
} from "@mui/material";
import api from "../api";

// Networks supported for mapping UI
const supportedNetworks = {
  BTC: ["Mainnet"],
  ETH: ["Mainnet"],
  USDT: ["ERC20", "TRC20"],
  USDC: ["ERC20", "SOL"]
};

export default function UserDepositAddressEditModal({ open, onClose, user, onSave }) {
  const [depositAddress, setDepositAddress] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize from user.depositAddresses if present
    setDepositAddress(user?.depositAddresses || {});
    setError("");
  }, [user, open]);

  const handleDepositAddressChange = (coin, net, value) => {
    setDepositAddress(prev => {
      const next = { ...(prev || {}) };
      next[coin] = { ...(next[coin] || {}) };
      next[coin][net] = value;
      return next;
    });
  };

  // Save: call admin endpoint per coin+network pair that has a value
  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const entries = [];
      for (const coin of Object.keys(supportedNetworks)) {
        const nets = supportedNetworks[coin];
        for (const net of nets) {
          const addr = depositAddress?.[coin]?.[net];
          if (addr && String(addr).trim()) {
            // Call admin endpoint for this specific coin+network
            try {
              const resp = await api.post(`/admin/user/${user._id}/deposit-address`, {
                coin,
                network: net,
                address: String(addr).trim()
              });
              entries.push({ coin, network: net, ok: true, resp: resp.data });
            } catch (e) {
              entries.push({ coin, network: net, ok: false, error: e?.response?.data || e?.message || String(e) });
            }
          }
        }
      }

      // If any failed, show a generic error
      const failed = entries.filter(r => !r.ok);
      if (failed.length > 0) {
        setError("Some addresses failed to save. Please retry or check the logs.");
        setSaving(false);
        return;
      }

      if (onSave) onSave(depositAddress);
      onClose();
    } catch (err) {
      setError("Failed to update deposit addresses");
      console.error("adminSetDepositAddress error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Deposit Addresses for {user?.email}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Set per-coin and per-network deposit addresses for this user. These addresses are used when users request deposits for the matching coin & network.
        </Typography>
        {Object.keys(supportedNetworks).map(coin => (
          <Box key={coin} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{coin}</Typography>
            {supportedNetworks[coin].map(net => (
              <TextField
                key={net}
                label={`${net} deposit address`}
                value={(depositAddress?.[coin] && depositAddress[coin][net]) || ""}
                onChange={e => handleDepositAddressChange(coin, net, e.target.value)}
                sx={{ mb: 1 }}
                fullWidth
              />
            ))}
          </Box>
        ))}
        {error && <Alert severity="error">{error}</Alert>}
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