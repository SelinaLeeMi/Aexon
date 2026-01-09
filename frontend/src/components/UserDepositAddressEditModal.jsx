import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, Typography, Divider
} from "@mui/material";
import api from "../api";

/**
 * Supported networks mapping. Keep consistent with AdminUserTable.
 * Each key is coin symbol -> array of networks
 */
const SUPPORTED_NETWORKS = {
  BTC: ["Mainnet"],
  ETH: ["Mainnet"],
  USDT: ["ERC20", "TRC20"],
  USDC: ["ERC20", "SOL"]
};

export default function UserDepositAddressEditModal({ open, onClose, user, onSave }) {
  const [depositAddress, setDepositAddress] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState([]); // optional per-entry results

  useEffect(() => {
    // Initialize from user.depositAddresses if present (plural)
    setDepositAddress(user?.depositAddresses ? { ...user.depositAddresses } : {});
    setError("");
    setResults([]);
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
    if (!user || !user._id) {
      setError("User not specified");
      return;
    }
    setError("");
    setSaving(true);
    setResults([]);
    const entries = [];
    try {
      for (const coin of Object.keys(SUPPORTED_NETWORKS)) {
        const nets = SUPPORTED_NETWORKS[coin];
        for (const net of nets) {
          const addr = depositAddress?.[coin]?.[net];
          if (addr && String(addr).trim()) {
            try {
              const resp = await api.post(`/admin/user/${user._id}/deposit-address`, {
                coin,
                network: net,
                address: String(addr).trim()
              });
              entries.push({ coin, network: net, ok: true, resp: resp.data });
            } catch (e) {
              const detail = e?.response?.data || e?.message || String(e);
              entries.push({ coin, network: net, ok: false, error: detail });
            }
          }
        }
      }

      // Determine failures
      const failed = entries.filter(r => !r.ok);
      setResults(entries);
      if (failed.length > 0) {
        setError("Some addresses failed to save. Please retry or check the logs.");
        setSaving(false);
        return;
      }

      // Success - call onSave with updated depositAddress mapping
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

        {Object.keys(SUPPORTED_NETWORKS).map(coin => (
          <Box key={coin} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{coin}</Typography>
            {SUPPORTED_NETWORKS[coin].map(net => (
              <TextField
                key={net}
                label={`${net} deposit address`}
                value={(depositAddress?.[coin] && depositAddress[coin][net]) || ""}
                onChange={e => handleDepositAddressChange(coin, net, e.target.value)}
                sx={{ mb: 1 }}
                fullWidth
              />
            ))}
            <Divider sx={{ my: 1 }} />
          </Box>
        ))}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {results.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {results.map((r, idx) => (
              <Box key={idx} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color={r.ok ? "success.main" : "error.main"}>
                  {r.coin} / {r.network}: {r.ok ? "Saved" : `Failed - ${String(r.error).slice(0, 120)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
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