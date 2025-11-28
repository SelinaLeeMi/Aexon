import React from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Box, Typography
} from "@mui/material";
import { adminBanUser, adminUnbanUser, adminSetDepositAddress } from "../api";

const supportedNetworks = ["BTC", "ETH", "USDT", "USDC"];

export default function AdminUserTable({ users = [], onEditDepositAddress, onRefresh }) {
  if (!users.length)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No users found.
      </Typography>
    );

  const handleBanUnban = async (u) => {
    if (u.isBanned) {
      await adminUnbanUser(u._id);
    } else {
      await adminBanUser(u._id);
    }
    if (onRefresh) onRefresh();
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
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.kyc?.status || "not_submitted"}</TableCell>
              <TableCell>{u.isBanned ? "BANNED" : "Active"}</TableCell>
              <TableCell>
                {supportedNetworks.map(net => (
                  <div key={net}>
                    <strong>{net}:</strong> {u.depositAddress?.[net] || "—"}
                  </div>
                ))}
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  aria-label={`Edit deposit addresses for ${u.email}`}
                  onClick={() => onEditDepositAddress(u)}
                  sx={{ mr: 1 }}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}