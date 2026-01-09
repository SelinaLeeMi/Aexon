import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Toolbar,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminUserTable from "../components/AdminUserTable";
import UserDepositAddressEditModal from "../components/UserDepositAddressEditModal";
import {
  getMe,
  adminGetUsers,
} from "../api";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Verify admin on mount
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await getMe();
        const user =
          res.data?.user ||
          res.data?.data ||
          res.data;
        const role = user?.role;
        if (role !== "admin") {
          navigate("/");
          return;
        }
        if (mounted) setReady(true);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const fetchUsers = useCallback(async (q = "") => {
    setLoadingUsers(true);
    try {
      const resp = await adminGetUsers(q);
      const payload = resp.data?.data || resp.data || [];
      setUsers(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Failed to fetch admin users", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchUsers();
  }, [ready, fetchUsers]);

  const handleRefresh = () => {
    fetchUsers(search);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveModal = (updatedAddresses) => {
    // After modal save, refresh users from server to ensure canonical state.
    // We keep behavior minimal and authoritative.
    fetchUsers(search);
  };

  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={1}>
        <Toolbar sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%" }}>
            <Typography variant="h6">Admin — Users</Typography>
            <TextField
              size="small"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchUsers(search);
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => fetchUsers(search)}>Search</Button>
                  </InputAdornment>
                ),
              }}
              sx={{ ml: 2, width: 360 }}
            />
          </Box>

          <Box>
            <Button variant="contained" onClick={() => fetchUsers("")} disabled={loadingUsers}>
              Refresh
            </Button>
          </Box>
        </Toolbar>

        <Box sx={{ p: 2 }}>
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No users found.</Typography>
          ) : (
            <AdminUserTable
              users={users}
              onEditDepositAddress={handleOpenEdit}
              onRefresh={handleRefresh}
            />
          )}
        </Box>
      </Paper>

      <UserDepositAddressEditModal
        open={modalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        onSave={handleSaveModal}
      />
    </Box>
  );
}