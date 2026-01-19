import React, { useEffect, useState } from "react";
import { getWallet, getCoins } from "../api";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useMediaQuery,
  Container,
} from "@mui/material";

const depositAddresses = {
  BTC: {
    Bitcoin: "1btcaddrxyz",
    ERC20: "erc20btcaddr",
    BEP20: "bep20btcaddr",
  },
  ETH: {
    Ethereum: "0xethaddrxyz",
    ERC20: "erc20ethaddr",
    BEP20: "bep20ethaddr",
  },
  USDT: {
    ERC20: "erc20usdtaddr",
    TRC20: "trc20usdtaddr",
    BEP20: "bep20usdtaddr",
  },
  USDC: {
    ERC20: "erc20usdcaddr",
    BEP20: "bep20usdcaddr",
  },
};

const networksPerCoin = {
  BTC: ["Bitcoin", "ERC20", "BEP20"],
  ETH: ["Ethereum", "ERC20", "BEP20"],
  USDT: ["ERC20", "TRC20", "BEP20"],
  USDC: ["ERC20", "BEP20"],
};

export default function Wallet() {
  const [wallet, setWallet] = useState([]);
  const [coins, setCoins] = useState([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [selectedNetwork, setSelectedNetwork] = useState("Bitcoin");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    getWallet().then(r => {
      const wallets = Array.isArray(r.data?.data)
        ? r.data.data
        : Array.isArray(r.data)
        ? r.data
        : Array.isArray(r.data.wallets)
        ? r.data.wallets
        : [];
      setWallet(wallets);
    }).catch(() => setWallet([]));

    getCoins().then(r => {
      if (r.data && Array.isArray(r.data.data)) {
        setCoins(r.data.data);
      } else if (Array.isArray(r.data)) {
        setCoins(r.data);
      } else {
        setCoins([]);
      }
    }).catch(() => setCoins([]));
  }, []);

  const totalUsdBalance = (() => {
    if (!wallet || !coins) return 0;
    let sum = 0;
    wallet.forEach(w => {
      const coin = coins.find(c => c.symbol?.toUpperCase() === w.coin?.toUpperCase());
      const price = coin?.price ?? coin?.current_price ?? 0;
      if (coin && price) {
        sum += Number(w.balance || 0) * Number(price);
      }
    });
    return sum;
  })();

  const handleDepositOpen = () => setDepositOpen(true);
  const handleDepositClose = () => setDepositOpen(false);

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 10 }}>
      <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} mb={3}>
        Wallet
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600}>Total Balance</Typography>
        <Typography variant="h4" fontWeight={700} color="#10B981" sx={{ mt: 1 }}>
          ${totalUsdBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
        </Typography>
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleDepositOpen}>Deposit</Button>
          <Button variant="outlined">Withdraw</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Assets</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Coin</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Deposit Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(wallet && wallet.length > 0)
              ? wallet.map(w => (
                  <TableRow key={w.coin}>
                    <TableCell>{w.coin}</TableCell>
                    <TableCell>{w.balance}</TableCell>
                    <TableCell style={{ wordBreak: "break-all" }}>{w.address || "—"}</TableCell>
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={3}>No assets in your wallet.</TableCell>
                </TableRow>
              )
            }
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={depositOpen} onClose={handleDepositClose} maxWidth="xs" fullWidth>
        <DialogTitle>Deposit Crypto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={e => {
                setSelectedCoin(e.target.value);
                setSelectedNetwork(networksPerCoin[e.target.value][0]);
              }}
            >
              {Object.keys(depositAddresses).map(c => (
                <MenuItem value={c} key={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Network</InputLabel>
            <Select
              value={selectedNetwork}
              label="Network"
              onChange={e => setSelectedNetwork(e.target.value)}
            >
              {networksPerCoin[selectedCoin].map(n => (
                <MenuItem value={n} key={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography>
            Deposit Address:
            <br />
            <b>
              {depositAddresses[selectedCoin][selectedNetwork] || "Not set"}
            </b>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDepositClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}