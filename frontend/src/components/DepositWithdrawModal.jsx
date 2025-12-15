import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Alert, Box, Chip, InputLabel, FormControl, Select
} from "@mui/material";
import api from "../api";

/**
 * DepositWithdrawModal
 * - Generic modal used for deposit or withdraw request creation.
 * - type: 'deposit' | 'withdraw'
 * - coins: [{ symbol, name }]
 * - onSubmit: async({ coin, amount, address }) -> creates request via API
 *
 * Deposit behavior:
 * - Default coin: BTC
 * - Default network: Bitcoin (Mainnet)
 * - NO address shown initially (address only fetched after user explicitly selects coin or network)
 * - Networks are dynamic based on coin selection (see mapping below)
 */

const NETWORKS_BY_COIN = {
  BTC: [{ key: "Mainnet", label: "Bitcoin (Mainnet)" }],
  ETH: [{ key: "Mainnet", label: "Ethereum (Mainnet)" }],
  USDT: [{ key: "ERC20", label: "ERC20" }, { key: "TRC20", label: "TRC20" }],
  USDC: [{ key: "ERC20", label: "ERC20" }, { key: "SOL", label: "Solana" }]
};

// Helper for warning messages (tailored)
function depositWarning(coin, network) {
  if (!coin || !network) return "";
  if (coin === "USDT" && network === "TRC20") return "Send only USDT via TRC20. Sending other assets may result in permanent loss.";
  if (coin === "USDT" && network === "ERC20") return "Send only USDT via ERC20 (ERC20 uses ETH network fees). Sending other assets may result in permanent loss.";
  if (coin === "BTC") return "Send only BTC to this Bitcoin (Mainnet) address. Sending other assets may result in permanent loss.";
  return `Send only ${coin} via ${network}. Sending other assets may result in permanent loss.`;
}

export default function DepositWithdrawModal({ open, onClose, coins = [], type = "deposit", onSubmit }) {
  const [selectedCoin, setSelectedCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressExists, setAddressExists] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false); // ensure address doesn't show initially

  useEffect(() => {
    if (open) {
      // default coin BTC if present, else first coin in list
      const defaultCoin = coins.find(c => c.symbol === "BTC") || coins[0] || { symbol: "BTC" };
      setSelectedCoin(defaultCoin.symbol);
      // default network (first available for the coin)
      const nets = NETWORKS_BY_COIN[defaultCoin.symbol] || [];
      setNetwork(nets[0]?.key || "");
      setAmount("");
      setAddress("");
      setAlert("");
      setAddressExists(false);
      setUserInteracted(false);
      setLoadingAddress(false);
    }
  }, [open, coins]);

  useEffect(() => {
    // Only fetch if the user explicitly selected/changed coin or network (userInteracted true).
    // This satisfies "NO address is shown initially" even though defaults exist.
    if (!open) return;
    if (type !== "deposit") return;
    if (!userInteracted) return;
    if (!selectedCoin || !network) return;

    let cancelled = false;
    const fetchAddress = async () => {
      setLoadingAddress(true);
      setAddress("");
      setAddressExists(false);
      try {
        const res = await api.get("/user/deposit-address", { params: { coin: selectedCoin, network } });
        if (cancelled) return;
        if (res && res.data && res.data.success && res.data.address) {
          setAddress(res.data.address);
          setAddressExists(true);
        } else {
          setAddress("");
          setAddressExists(false);
        }
      } catch (err) {
        // 404 or other -> treat as no address assigned
        setAddress("");
        setAddressExists(false);
      } finally {
        if (!cancelled) setLoadingAddress(false);
      }
    };

    fetchAddress();

    return () => { cancelled = true; };
  }, [selectedCoin, network, userInteracted, open, type]);

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
      // For deposit requests, address is internal; user submits coin and amount (address is server-side mapping)
      await onSubmit({
        coin: selectedCoin,
        amount: Number(amount),
        address: type === "deposit" ? undefined : address,
        network: type === "deposit" ? network : undefined
      });
      setSubmitting(false);
      onClose();
    } catch (e) {
      setSubmitting(false);
      setAlert(typeof e === "string" ? e : (e?.message || "Request failed"));
    }
  };

  const handleCoinChange = (val) => {
    setSelectedCoin(val);
    // set default network for coin
    const nets = NETWORKS_BY_COIN[val] || [];
    setNetwork(nets[0]?.key || "");
    setAddress("");
    setAddressExists(false);
    setUserInteracted(true);
  };

  const handleNetworkChange = (val) => {
    setNetwork(val);
    setAddress("");
    setAddressExists(false);
    setUserInteracted(true);
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      // small local feedback: temporary alert
      setAlert("Copied address to clipboard");
      setTimeout(() => setAlert(""), 2000);
    } catch (e) {
      setAlert("Copy failed");
      setTimeout(() => setAlert(""), 2000);
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
            onChange={e => handleCoinChange(e.target.value)}
            sx={{ minWidth: 120, flex: 1 }}
            required
          >
            {coins.map(c => (
              <MenuItem key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</MenuItem>
            ))}
          </TextField>

          {type === "deposit" ? (
            <FormControl sx={{ minWidth: 160, flex: 1 }}>
              <InputLabel>Network</InputLabel>
              <Select
                value={network}
                label="Network"
                onChange={e => handleNetworkChange(e.target.value)}
              >
                {(NETWORKS_BY_COIN[selectedCoin] || []).map(n => (
                  <MenuItem key={n.key} value={n.key}>{n.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label={type === "deposit" ? "Amount" : `Amount (${selectedCoin || "COIN"})`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              sx={{ minWidth: 160, flex: 2 }}
              required
            />
          )}

          <TextField
            label="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            sx={{ minWidth: 160, flex: 2 }}
            required
          />
        </Box>

        {/* Deposit-specific address display */}
        {type === "deposit" && (
          <Box sx={{ mt: 2 }}>
            {!userInteracted && (
              <Alert severity="info">Select coin and network to display your deposit address.</Alert>
            )}

            {userInteracted && loadingAddress && (
              <Alert severity="info">Checking for assigned deposit address...</Alert>
            )}

            {userInteracted && !loadingAddress && addressExists && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Chip label={network} size="small" />
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" onClick={handleCopy} disabled={!address}>Copy</Button>
                </Box>
                <TextField
                  label="Deposit Address"
                  value={address}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 1 }}
                />
                <Alert severity="warning">{depositWarning(selectedCoin, network)}</Alert>
              </Box>
            )}

            {userInteracted && !loadingAddress && !addressExists && (
              <Alert severity="warning">Deposit address not assigned. Please contact support.</Alert>
            )}
          </Box>
        )}

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