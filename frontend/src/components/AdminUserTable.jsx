import React from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Box, Typography, IconButton, Tooltip, Stack
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { adminBanUser, adminUnbanUser } from "../api";

/**
 * Supported networks mapping. Keep consistent with modal.
 * Each key is coin symbol -> array of networks
 */
const SUPPORTED_NETWORKS = {
  BTC: ["Mainnet"],
  ETH: ["Mainnet"],
  USDT: ["ERC20", "TRC20"],
  USDC: ["ERC20", "SOL"]
};

function truncateAddress(addr = "", prefix = 8, suffix = 6) {
  if (!addr) return "";
  if (addr.length <= prefix + suffix + 3) return addr;
  return `${addr.slice(0, prefix)}...${addr.slice(-suffix)}`;
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text);
  } catch (e) {
    // fallback
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

export default function AdminUserTable({ users = [], onEditDepositAddress, onRefresh }) {
  if (!users.length)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No users found.
      </Typography>
    );

  const handleBanUnban = async (u) => {
    try {
      if (u.isBanned) {
        await adminUnbanUser(u._id);
      } else {
        await adminBanUser(u._id);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to ban/unban user", err);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" aria-label="admin user table">
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>KYC Status</TableCell>
            <TableCell>Banned</TableCell>
            <TableCell>Deposit Addresses</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u._id}>
              <TableCell sx={{ maxWidth: 220, wordBreak: "break-all" }}>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.kyc?.status || "not_submitted"}</TableCell>
              <TableCell>{u.isBanned ? "BANNED" : "Active"}</TableCell>
              <TableCell sx={{ minWidth: 300 }}>
                {Object.keys(SUPPORTED_NETWORKS).map(coin => (
                  <Box key={coin} sx={{ mb: 1 }}>
                    <Typography component="span" variant="subtitle2" sx={{ mr: 1 }}>{coin}:</Typography>
                    {SUPPORTED_NETWORKS[coin].map(net => {
                      const addr = u.depositAddresses?.[coin]?.[net] || null;
                      return (
                        <Box key={net} sx={{ display: "inline-flex", alignItems: "center", mr: 2 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            <strong>{net}:</strong> {addr ? truncateAddress(addr) : "—"}
                          </Typography>
                          {addr && (
                            <Tooltip title="Copy address">
                              <IconButton size="small" onClick={() => copyToClipboard(addr)}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    aria-label={`Edit deposit addresses for ${u.email}`}
                    onClick={() => onEditDepositAddress && onEditDepositAddress(u)}
                  >
                    Edit Deposit Addresses
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color={u.isBanned ? "success" : "error"}
                    aria-label={u.isBanned ? `Unban ${u.email}` : `Ban ${u.email}`}
                    onClick={() => handleBanUnban(u)}
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}