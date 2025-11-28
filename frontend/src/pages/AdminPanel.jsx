import React, { useEffect, useMemo, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  TextField,
  Button,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PublishIcon from "@mui/icons-material/Publish";
import CampaignIcon from "@mui/icons-material/Campaign";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import api from "../api";
import { useNotification } from "../components/NotificationProvider";
import { useRealtime } from "../context/RealtimeContext";

/**
 * AdminPanel (full-featured)
 *
 * Purpose:
 * - Extend the earlier minimal broadcast UI into a comprehensive admin console.
 * - Tabs included:
 *    1. Overview (simple stats + quick broadcast)
 *    2. Users (search, view, ban/promote, adjust balances)
 *    3. Wallets (pending deposits/withdrawals review)
 *    4. Trades (view/force/cancel)
 *    5. Price Overrides (manual price set + broadcast)
 *    6. Logs (tail / fetch)
 *    7. Settings (basic toggles)
 *
 * Implementation notes:
 * - All actions call the expected backend endpoints under /admin/* or common endpoints:
 *    - GET /admin/summary
 *    - GET /admin/users?search=
 *    - POST /admin/user/:id/action  { action: 'ban'|'unban'|'promote'|'demote' }
 *    - POST /admin/user/:id/adjust-balance { coin, delta, reason }
 *    - GET /admin/wallets?status=pending
 *    - POST /admin/wallets/:id/approve
 *    - POST /admin/wallets/:id/reject { reason }
 *    - GET /admin/trades
 *    - POST /admin/trades/:id/cancel
 *    - POST /admin/broadcast { type, payload }
 *    - POST /admin/price_override { symbol, price, broadcast: true|false }
 *    - GET /admin/logs?tail=true&limit=200
 *    - GET /admin/settings
 *    - POST /admin/settings
 *
 * - The backend must implement and secure those endpoints (admin-only).
 * - The UI will optimistically refresh lists after actions; errors are surfaced via NotificationProvider.
 *
 * - This file is intentionally comprehensive so you don't need multiple smaller files for admin tasks.
 * - Replace or extend endpoints if your backend uses different routes; I tried to match common patterns.
 */

function SectionPaper({ title, icon, children, sx }) {
  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, ...sx }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        {icon}
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

export default function AdminPanel() {
  const notify = useNotification();
  const realtime = useRealtime();

  const [tab, setTab] = useState(0);

  // Overview
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Adjust balance dialog
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjCoin, setAdjCoin] = useState("USDT");
  const [adjDelta, setAdjDelta] = useState("");
  const [adjReason, setAdjReason] = useState("");

  // Wallets (deposits/withdrawals)
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletFilter, setWalletFilter] = useState("pending");

  // Trades
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesSearch, setTradesSearch] = useState("");

  // Price override & broadcast
  const [priceSymbol, setPriceSymbol] = useState("BTC");
  const [priceValue, setPriceValue] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("Announcement");

  // Logs
  const [logs, setLogs] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [tailLogs, setTailLogs] = useState(false);

  // Settings
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [busy, setBusy] = useState(false);

  // Basic refresh helpers
  const refreshSummary = async () => {
    setLoadingSummary(true);
    try {
      const r = await api.get("/admin/summary");
      setSummary(r.data?.data || r.data || null);
    } catch (e) {
      // ignore; show notification on demand
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchUsers = async (q = "") => {
    setUsersLoading(true);
    try {
      const r = await api.get("/admin/users", { params: { search: q } });
      setUsers(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []));
    } catch (e) {
      notify.showNotification("Failed to fetch users", "error", 4000);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchWallets = async (status = "pending") => {
    setWalletsLoading(true);
    try {
      const r = await api.get("/admin/wallets", { params: { status } });
      setWallets(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []));
    } catch (e) {
      notify.showNotification("Failed to fetch wallet items", "error", 4000);
    } finally {
      setWalletsLoading(false);
    }
  };

  const fetchTrades = async (q = "") => {
    setTradesLoading(true);
    try {
      const r = await api.get("/admin/trades", { params: { search: q } });
      setTrades(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []));
    } catch (e) {
      notify.showNotification("Failed to fetch trades", "error", 4000);
    } finally {
      setTradesLoading(false);
    }
  };

  const fetchLogs = async (tail = false) => {
    setLogsLoading(true);
    try {
      const r = await api.get("/admin/logs", { params: { tail, limit: 500 } });
      setLogs(typeof r.data === "string" ? r.data : (r.data?.data || JSON.stringify(r.data || "", null, 2)));
    } catch (e) {
      setLogs("Failed to load logs.");
      notify.showNotification("Failed to load logs", "error", 4000);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const r = await api.get("/admin/settings");
      setSettings(r.data?.data || r.data || {});
    } catch (e) {
      // ignore
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    refreshSummary();
    fetchUsers();
    fetchWallets(walletFilter);
    fetchTrades();
    fetchSettings();
    // also tail logs if configured
    // eslint-disable-next-line
  }, []);

  // Pull realtime prices into local suggestions where available
  const symbolOptions = useMemo(() => {
    // realtime.prices expected shape: { BTC: { price }, ETH: {...} }
    const keys = realtime?.prices ? Object.keys(realtime.prices) : [];
    // add some common fallbacks
    const base = ["BTC", "ETH", "USDT", "USDC", "BNB", "XRP"];
    const merged = Array.from(new Set([...base, ...keys])).slice(0, 200);
    return merged;
  }, [realtime?.prices]);

  // User actions
  const doUserAction = async (userId, action) => {
    if (!window.confirm(`Confirm ${action} for user ${userId}?`)) return;
    setBusy(true);
    try {
      await api.post(`/admin/user/${userId}/action`, { action });
      notify.showNotification(`Action ${action} applied`, "success", 3000);
      fetchUsers(userSearch);
      refreshSummary();
    } catch (e) {
      const msg = (e?.response?.data?.error) || e?.message || "User action failed";
      notify.showNotification(msg, "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  const openAdjustDialog = (user) => {
    setSelectedUser(user);
    setAdjCoin("USDT");
    setAdjDelta("");
    setAdjReason("");
    setAdjOpen(true);
  };

  const submitAdjustBalance = async () => {
    if (!selectedUser) return;
    if (!adjDelta || isNaN(Number(adjDelta))) {
      notify.showNotification("Enter numeric delta", "error", 4000);
      return;
    }
    setBusy(true);
    try {
      await api.post(`/admin/user/${selectedUser._id || selectedUser.id}/adjust-balance`, {
        coin: adjCoin,
        delta: Number(adjDelta),
        reason: adjReason || "admin adjustment"
      });
      notify.showNotification("Balance adjusted", "success", 3000);
      setAdjOpen(false);
      fetchUsers(userSearch);
      fetchWallets(walletFilter);
      refreshSummary();
    } catch (e) {
      const msg = (e?.response?.data?.error) || e?.message || "Adjustment failed";
      notify.showNotification(msg, "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  // Wallet actions (approve/reject)
  const handleWalletApprove = async (id) => {
    if (!window.confirm("Approve this wallet/deposit?")) return;
    setBusy(true);
    try {
      await api.post(`/admin/wallets/${id}/approve`);
      notify.showNotification("Approved", "success", 3000);
      fetchWallets(walletFilter);
      refreshSummary();
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Approve failed", "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  const handleWalletReject = async (id) => {
    const reason = window.prompt("Reject reason (optional):", "Invalid deposit");
    if (reason === null) return;
    setBusy(true);
    try {
      await api.post(`/admin/wallets/${id}/reject`, { reason });
      notify.showNotification("Rejected", "success", 3000);
      fetchWallets(walletFilter);
      refreshSummary();
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Reject failed", "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  // Trades actions
  const handleTradeCancel = async (tradeId) => {
    if (!window.confirm("Cancel this trade?")) return;
    setBusy(true);
    try {
      await api.post(`/admin/trades/${tradeId}/cancel`);
      notify.showNotification("Trade cancelled", "success", 3000);
      fetchTrades(tradesSearch);
      refreshSummary();
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Cancel failed", "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  // Broadcast
  const handleBroadcast = async () => {
    if (!broadcastMessage && !priceValue) {
      notify.showNotification("Provide message or price to broadcast", "error", 4000);
      return;
    }
    setBusy(true);
    try {
      const payload = {
        type: "system_message",
        payload: { title: broadcastTitle, message: broadcastMessage }
      };
      // If priceValue provided, send price update first (optional)
      if (priceValue !== "") {
        // send price_override optionally
        await api.post("/admin/price_override", { symbol: priceSymbol.toUpperCase(), price: Number(priceValue), broadcast: true });
        notify.showNotification("Price override broadcasted", "success", 3000);
      }
      // send system message if present
      if (broadcastMessage) {
        await api.post("/admin/broadcast", payload);
        notify.showNotification("System broadcast sent", "success", 3000);
      }
      // pro-active local update (RealtimeProvider may already broadcast when backend does)
      // quick attempt: call /coin to refresh prices into RealtimeProvider seed if backend updated coin endpoint
      try {
        const coinsRes = await api.get("/coin");
        // let RealtimeProvider pick up via polling/WS; we just trigger a small notification here
        notify.showNotification("Broadcast complete, clients will receive update", "success", 4000);
      } catch {}
      refreshSummary();
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Broadcast failed", "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  // Price override dedicated
  const handlePriceOverride = async () => {
    if (!priceSymbol || priceValue === "") {
      notify.showNotification("Provide symbol and price", "error", 4000);
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/price_override", { symbol: priceSymbol.toUpperCase(), price: Number(priceValue), broadcast: true });
      notify.showNotification(`Price override ${priceSymbol.toUpperCase()} => ${priceValue}`, "success", 3000);
      // Try to nudge RealtimeProvider by hitting /coin (seed)
      try { await api.get("/coin"); } catch {}
      refreshSummary();
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Price override failed", "error", 6000);
    } finally {
      setBusy(false);
    }
  };

  // Logs tail toggle
  useEffect(() => {
    let tailTimer = null;
    if (tailLogs) {
      // poll logs every 3s when tailing
      fetchLogs(true);
      tailTimer = setInterval(() => fetchLogs(true), 3000);
    } else {
      fetchLogs(false);
    }
    return () => {
      if (tailTimer) clearInterval(tailTimer);
    };
    // eslint-disable-next-line
  }, [tailLogs]);

  const saveSettings = async (newSettings) => {
    setSettingsLoading(true);
    try {
      await api.post("/admin/settings", newSettings || settings);
      notify.showNotification("Settings saved", "success", 3000);
      setSettings(newSettings || settings);
    } catch (e) {
      notify.showNotification((e?.response?.data?.error) || e?.message || "Save failed", "error", 6000);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Simple CSV export helper
  const downloadCsv = (rows = [], filename = "export.csv") => {
    if (!rows || rows.length === 0) {
      notify.showNotification("No rows to export", "error", 3000);
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(",")]
      .concat(rows.map(r => keys.map(k => `"${String((r[k] === undefined || r[k] === null) ? "" : r[k]).replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 10, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Admin Console</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh summary">
            <IconButton onClick={refreshSummary}><RefreshIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Refresh users">
            <IconButton onClick={() => fetchUsers(userSearch)}><AccountCircleIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Refresh wallets">
            <IconButton onClick={() => fetchWallets(walletFilter)}><PaymentsIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Refresh trades">
            <IconButton onClick={() => fetchTrades(tradesSearch)}><ReceiptLongIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Overview" />
          <Tab label="Users" />
          <Tab label="Wallets" />
          <Tab label="Trades" />
          <Tab label="Price Overrides" />
          <Tab label="Broadcast / Messages" />
          <Tab label="Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab panels */}
      {tab === 0 && (
        <Box>
          <SectionPaper title="Overview" icon={<HistoryIcon />}>
            {loadingSummary ? (
              <CircularProgress />
            ) : summary ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Users</Typography>
                    <Typography variant="h6" fontWeight={700}>{summary.users || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Active WS Clients</Typography>
                    <Typography variant="h6" fontWeight={700}>{summary.wsClients || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Open Trades</Typography>
                    <Typography variant="h6" fontWeight={700}>{summary.openTrades || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Pending Wallets</Typography>
                    <Typography variant="h6" fontWeight={700}>{summary.pendingWallets || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography fontWeight={700} mb={1}>Quick Price Override</Typography>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Symbol</InputLabel>
                          <Select value={priceSymbol} label="Symbol" onChange={e => setPriceSymbol(e.target.value)}>
                            {symbolOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Price" value={priceValue} onChange={e => setPriceValue(e.target.value)} fullWidth type="number" />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button variant="contained" onClick={handlePriceOverride} startIcon={<PublishIcon />}>Override & Broadcast</Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Typography>No summary available</Typography>
            )}
          </SectionPaper>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <SectionPaper title="User Management" icon={<AccountCircleIcon />}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  placeholder="Search by username, email or id"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  fullWidth
                  onKeyDown={e => { if (e.key === "Enter") fetchUsers(userSearch); }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => { setUserSearch(""); fetchUsers(""); }}>Clear</Button>
                  <Button variant="contained" onClick={() => fetchUsers(userSearch)}>Search</Button>
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              {usersLoading ? <CircularProgress /> : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>KYC</TableCell>
                        <TableCell>Balance Summary</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u._id || u.id}>
                          <TableCell>{u.username || u.name || u._id}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.role || "user"}</TableCell>
                          <TableCell>{u.kycStatus || "unknown"}</TableCell>
                          <TableCell>
                            {Array.isArray(u.wallets) ? u.wallets.slice(0,3).map(w => `${w.coin}:${w.balance}`).join(", ") : (u.balanceSummary || "—")}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" onClick={() => { setSelectedUser(u); }}>
                                View
                              </Button>
                              <Button size="small" variant="contained" onClick={() => doUserAction(u._id || u.id, u.banned ? "unban" : "ban")}>
                                {u.banned ? "Unban" : "Ban"}
                              </Button>
                              <Button size="small" variant="contained" color="secondary" onClick={() => doUserAction(u._id || u.id, u.role === "admin" ? "demote" : "promote")}>
                                {u.role === "admin" ? "Demote" : "Promote"}
                              </Button>
                              <Button size="small" variant="text" onClick={() => openAdjustDialog(u)}>Adjust</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button onClick={() => downloadCsv(users, "users.csv")}>Export CSV</Button>
                    <Button variant="outlined" onClick={() => fetchUsers(userSearch)}>Refresh</Button>
                  </Box>
                </>
              )}
            </Box>
          </SectionPaper>

          {/* Adjust balance dialog */}
          <Dialog open={adjOpen} onClose={() => setAdjOpen(false)}>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogContent>
              <Typography fontWeight={700} mb={1}>{selectedUser ? (selectedUser.username || selectedUser.email) : ""}</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Coin</InputLabel>
                <Select value={adjCoin} label="Coin" onChange={e => setAdjCoin(e.target.value)}>
                  {symbolOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Delta (positive to credit, negative to debit)" value={adjDelta} onChange={e => setAdjDelta(e.target.value)} fullWidth sx={{ mb: 2 }} type="number" />
              <TextField label="Reason (optional)" value={adjReason} onChange={e => setAdjReason(e.target.value)} fullWidth multiline rows={2} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAdjOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={submitAdjustBalance} disabled={busy}>Submit</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <SectionPaper title="Wallets / Deposits / Withdrawals" icon={<PaymentsIcon />}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={walletFilter} label="Status" onChange={e => { setWalletFilter(e.target.value); fetchWallets(e.target.value); }}>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8} sx={{ textAlign: "right" }}>
                <Button onClick={() => fetchWallets(walletFilter)}>Refresh</Button>
                <Button onClick={() => downloadCsv(wallets, "wallets.csv")}>Export CSV</Button>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              {walletsLoading ? <CircularProgress /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Coin</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tx</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wallets.map(w => (
                      <TableRow key={w._id || w.id}>
                        <TableCell>{w._id || w.id}</TableCell>
                        <TableCell>{w.user?.email || w.userId || w.user}</TableCell>
                        <TableCell>{w.coin}</TableCell>
                        <TableCell>{w.amount}</TableCell>
                        <TableCell style={{ wordBreak: "break-all" }}>{w.address || "-"}</TableCell>
                        <TableCell>{w.status}</TableCell>
                        <TableCell>{w.tx || "-"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {w.status === "pending" && <Button size="small" variant="contained" onClick={() => handleWalletApprove(w._id || w.id)}>Approve</Button>}
                            {w.status === "pending" && <Button size="small" color="error" onClick={() => handleWalletReject(w._id || w.id)}>Reject</Button>}
                            <Button size="small" onClick={() => downloadCsv([w], `wallet-${w._id||w.id}.csv`)}>Export</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </SectionPaper>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <SectionPaper title="Trades" icon={<ReceiptLongIcon />}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField placeholder="Search by pair, user, id" value={tradesSearch} onChange={e => setTradesSearch(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: "right" }}>
                <Button onClick={() => fetchTrades(tradesSearch)}>Search</Button>
                <Button onClick={() => downloadCsv(trades, "trades.csv")}>Export CSV</Button>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              {tradesLoading ? <CircularProgress /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Pair</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trades.map(t => (
                      <TableRow key={t._id || t.id}>
                        <TableCell>{t._id || t.id}</TableCell>
                        <TableCell>{t.pair}</TableCell>
                        <TableCell>{t.type}</TableCell>
                        <TableCell>{t.amount}</TableCell>
                        <TableCell>{t.price}</TableCell>
                        <TableCell>{t.user?.email || t.userId}</TableCell>
                        <TableCell>{t.status || "filled"}</TableCell>
                        <TableCell>{new Date(t.createdAt || t.timestamp || Date.now()).toLocaleString()}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => handleTradeCancel(t._id || t.id)}>Cancel</Button>
                            <Button size="small" onClick={() => downloadCsv([t], `trade-${t._id||t.id}.csv`)}>Export</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </SectionPaper>
        </Box>
      )}

      {tab === 4 && (
        <Box>
          <SectionPaper title="Price Overrides" icon={<CampaignIcon />}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Symbol</InputLabel>
                  <Select value={priceSymbol} label="Symbol" onChange={e => setPriceSymbol(e.target.value)}>
                    {symbolOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Price" value={priceValue} onChange={e => setPriceValue(e.target.value)} fullWidth type="number" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={handlePriceOverride}>Override & Broadcast</Button>
                  <Button variant="outlined" onClick={() => { setPriceValue(""); notify.showNotification("Cleared", "info"); }}>Clear</Button>
                </Stack>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Overriding prices should be used only for testing or emergency maintenance. Ideally your backend stores price overrides and broadcasts to all clients.</Typography>
            </Box>
          </SectionPaper>
        </Box>
      )}

      {tab === 5 && (
        <Box>
          <SectionPaper title="Broadcast / Messages" icon={<CampaignIcon />}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Title" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Short Preview" value={priceValue} onChange={e => setPriceValue(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Message Body" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} fullWidth multiline rows={4} />
              </Grid>
              <Grid item xs={12} sx={{ textAlign: "right" }}>
                <Button variant="contained" onClick={handleBroadcast} disabled={busy}>Send Broadcast</Button>
                <Button sx={{ ml: 1 }} onClick={() => { setBroadcastMessage(""); setBroadcastTitle("Announcement"); }}>Clear</Button>
              </Grid>
            </Grid>
          </SectionPaper>
        </Box>
      )}

      {tab === 6 && (
        <Box>
          <SectionPaper title="Logs" icon={<HistoryIcon />}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Button variant={tailLogs ? "contained" : "outlined"} onClick={() => setTailLogs(v => !v)}>{tailLogs ? "Stop Tail" : "Tail Logs"}</Button>
              <Button onClick={() => fetchLogs(false)}>Refresh</Button>
              <Button onClick={() => { navigator.clipboard?.writeText(logs || ""); notify.showNotification("Logs copied", "success", 2000); }}>Copy</Button>
              <Button onClick={() => downloadCsv(logs.split("\n").map((l, i) => ({ line: i + 1, text: l })), "logs.csv")}>Export</Button>
            </Stack>
            <Paper sx={{ p: 2, bgcolor: "#0f1724", color: "#fff", fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: 420, overflow: "auto" }}>
              {logsLoading ? <CircularProgress /> : <Typography component="div" sx={{ fontSize: 12 }}>{logs || "No logs"}</Typography>}
            </Paper>
          </SectionPaper>
        </Box>
      )}

      {tab === 7 && (
        <Box>
          <SectionPaper title="Settings" icon={<SettingsIcon />}>
            {settingsLoading ? <CircularProgress /> : (
              <>
                <TextField label="Site Title" value={settings.siteTitle || ""} onChange={e => setSettings(s => ({ ...s, siteTitle: e.target.value }))} fullWidth sx={{ mb: 2 }} />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Trade Mode</InputLabel>
                  <Select value={settings.tradeMode || "live"} label="Trade Mode" onChange={e => setSettings(s => ({ ...s, tradeMode: e.target.value }))}>
                    <MenuItem value="live">Live</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="read-only">Read-only</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Support Email" value={settings.supportEmail || ""} onChange={e => setSettings(s => ({ ...s, supportEmail: e.target.value }))} fullWidth sx={{ mb: 2 }} />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={() => saveSettings()}>Save Settings</Button>
                  <Button onClick={() => fetchSettings()}>Reload</Button>
                </Stack>
              </>
            )}
          </SectionPaper>
        </Box>
      )}

      {/* Small inline snack fallback if NotificationProvider unavailable */}
      <Snackbar open={false} autoHideDuration={3000} onClose={() => {}} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="info" action={<IconButton size="small"><CloseIcon fontSize="small" /></IconButton>}>Placeholder</Alert>
      </Snackbar>
    </Box>
  );
}