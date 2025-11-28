import React, { useEffect, useState, useRef } from "react";
import { getMe } from "../api";
import { Paper, Typography, Box, TextField, Button, Avatar, CircularProgress, Alert } from "@mui/material";
import axios from "axios";

export default function ChatSupport() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState({});
  const scrollRef = useRef();

  useEffect(() => {
    getMe().then(u => setUser(u.data || {}));
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/api/chat", { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.data || []);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    } catch (e) {
      setError("Failed to load chat messages");
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!msg.trim()) return;
    setSending(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post("/api/chat", { message: msg }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg("");
      fetchMessages();
    } catch (e) {
      setError("Failed to send message");
    }
    setSending(false);
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Customer Support Chat</Typography>
      {loading && <CircularProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error">{error}</Alert>}
      <Box ref={scrollRef} sx={{ maxHeight: 300, overflowY: "auto", mb: 2, p: 1, bgcolor: "#181B2A", borderRadius: 2 }}>
        {!loading && messages.map((m, i) => (
          <Box key={i} sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <Avatar sx={{ mr: 1, width: 28, height: 28 }}>{m.user.email[0]?.toUpperCase()}</Avatar>
            <Box>
              <Typography fontSize={14} fontWeight={600}>{m.user.email} {m.user.role === "admin" && <span style={{color:"#10B981"}}>(Admin)</span>}</Typography>
              <Typography fontSize={14}>{m.message}</Typography>
              <Typography fontSize={11} color="text.secondary">{new Date(m.createdAt).toLocaleString()}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Type your message"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          fullWidth
          size="small"
          disabled={sending}
          inputProps={{ "aria-label": "Type your message" }}
        />
        <Button variant="contained" onClick={sendMessage} disabled={sending || !msg.trim()}>
          {sending ? <CircularProgress size={20} /> : "Send"}
        </Button>
      </Box>
    </Paper>
  );
}