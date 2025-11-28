import React, { useEffect, useState } from "react";
import { getMe, submitKyc, getWallet } from "../api";
import axios from "axios";
import {
  Paper,
  Typography,
  Avatar,
  Box,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import BottomNav from "../components/BottomNav";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MenuIcon from "@mui/icons-material/Menu";

export default function Profile() {
  const [user, setUser] = useState({});
  const [kycOpen, setKycOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [kycError, setKycError] = useState("");
  const [wallets, setWallets] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [usernameEdit, setUsernameEdit] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    getMe().then(r => {
      setUser(r.data);
      setKycStatus(r.data.kyc?.status || "not_submitted");
      setKycError(r.data.kyc?.error || "");
      setUsernameEdit(r.data.username || "");
      setProfilePhoto(r.data.avatar || "");
    });
    getWallet().then(r => setWallets(r.data));
    axios.get("/api/referral/my", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => setReferrals(r.data));
  }, []);

  const handleKycSubmit = async (formData) => {
    try {
      await submitKyc(formData);
      setKycStatus("pending");
      setKycError("");
    } catch {
      setKycError("Upload failed");
    }
  };

  const handleUsernameChange = async () => {
    if (!usernameEdit || usernameEdit.length < 3) {
      setUsernameMsg("Username must be at least 3 characters.");
      return;
    }
    setLoadingUsername(true);
    setUsernameMsg("");
    try {
      const res = await axios.patch("/api/auth/username", { username: usernameEdit }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUsernameMsg("Username updated!");
      setUser({ ...user, username: usernameEdit });
      localStorage.setItem("user", JSON.stringify({ ...user, username: usernameEdit }));
    } catch (err) {
      setUsernameMsg(err.response?.data?.message || "Error updating username.");
    }
    setLoadingUsername(false);
  };

  const handleCopyReferral = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setUsernameMsg("Referral code copied to clipboard!");
      setTimeout(() => setUsernameMsg(""), 1500);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePhoto(url);
      // Optionally, upload to backend here
    }
  };

  const handleClaimReferral = async () => {
    setClaimMsg("");
    if (!claimCode || claimCode.length < 4) {
      setClaimMsg("Enter a valid referral code.");
      return;
    }
    try {
      await axios.post("/api/referral/claim", { code: claimCode }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setClaimMsg("Referral reward claimed!");
      setClaimCode("");
    } catch (err) {
      setClaimMsg(err.response?.data?.message || "Failed to claim reward.");
    }
  };

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 10 }}>
      <Paper sx={{ p: 4, mb: 4, position: "relative" }}>
        <Box sx={{ position: "relative", mb: 2 }}>
          <IconButton
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon fontSize="large" />
          </IconButton>
          <Box sx={{ pl: 7 }}>
            <Typography variant="h5" fontWeight={700}>
              {user.username && !user.username.startsWith("aexonuser_")
                ? user.username
                : "Aexon User"}
            </Typography>
            <Typography color="#9ca3af">{user.email}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={profilePhoto} sx={{ width: 80, height: 80, fontSize: 32 }}>
            {user.username?.[0]?.toUpperCase() || ""}
          </Avatar>
          <Box>
            <Chip label={`KYC: ${kycStatus}`} color={
              kycStatus === "verified" ? "success" :
                kycStatus === "pending" ? "info" :
                  kycStatus === "rejected" ? "error" : "default"
            } sx={{ mt: 2 }} />
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setKycOpen(true)}>
              {kycStatus === "verified" ? "View KYC" : "Submit KYC"}
            </Button>
            <Box sx={{ mt: 2 }}>
              <Typography>
                Referral Code: <b>{user.referralCode || "—"}</b>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  sx={{ ml: 1 }}
                  onClick={handleCopyReferral}
                  disabled={!user.referralCode}
                >Copy</Button>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                  onClick={() => setClaimOpen(true)}
                >Claim Reward</Button>
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <label htmlFor="upload-photo">
                <input
                  id="upload-photo"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoUpload}
                />
                <Button variant="outlined" startIcon={<CloudUploadIcon />} component="span">
                  Upload Photo
                </Button>
              </label>
            </Box>
          </Box>
        </Box>
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography fontWeight={700}>Change Username</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
            <TextField
              label="Username"
              value={usernameEdit}
              onChange={e => setUsernameEdit(e.target.value)}
              size="small"
              sx={{ width: 180 }}
              disabled={loadingUsername}
            />
            <Button variant="contained" onClick={handleUsernameChange} disabled={loadingUsername}>
              Update
            </Button>
          </Box>
          {usernameMsg && <Alert severity="info" sx={{ mt: 1 }}>{usernameMsg}</Alert>}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={700}>My Wallet</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coin</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Deposit Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wallets.map(w => (
                <TableRow key={w.coin}>
                  <TableCell>{w.coin}</TableCell>
                  <TableCell>{w.balance}</TableCell>
                  <TableCell>{w.address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700}>My Referrals</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Referred Email</TableCell>
                <TableCell>Joined At</TableCell>
                <TableCell>Reward</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.map(r => (
                <TableRow key={r._id}>
                  <TableCell>{r.referred?.email || "—"}</TableCell>
                  <TableCell>{new Date(r.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{r.rewardGiven ? "Given" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
      {/* KYC Modal */}
      <Dialog open={kycOpen} onClose={() => setKycOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>KYC Verification</DialogTitle>
        <DialogContent>
          <TextField
            label="Document URL (image/pdf)"
            value={kycError}
            onChange={e => setKycError(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Paste link to your document/file here"
          />
          <Button
            variant="contained"
            onClick={() => {
              handleKycSubmit({ documentUrl: kycError });
              setKycOpen(false);
            }}
            fullWidth
            disabled={!kycError}
          >
            Submit KYC
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={claimOpen} onClose={() => setClaimOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Claim Referral Reward</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter Referral Code"
            value={claimCode}
            onChange={e => setClaimCode(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          {claimMsg && <Alert severity="info" sx={{ mt: 1 }}>{claimMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleClaimReferral}>Claim</Button>
        </DialogActions>
      </Dialog>
      <BottomNav />
    </Box>
  );
}