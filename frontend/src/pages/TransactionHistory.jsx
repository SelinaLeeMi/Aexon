import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Box
} from "@mui/material";
import { downloadCSV } from "../utils/csvExport";
import { getWallet } from "../api";

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "trade", label: "Trade" }
];

export default function TransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [filterCoin, setFilterCoin] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    // Replace with your real API for transaction history if needed.
    getWallet().then(res => {
      setRows(res.data.rows || []);
      setLoading(false);
    });
  }, []);

  // Filtering
  const filteredRows = rows
    .filter(row => (filterCoin ? row.coin === filterCoin : true))
    .filter(row => (filterType ? row.type === filterType : true))
    .filter(row =>
      filterDate ? row.timestamp?.startsWith?.(filterDate) : true
    );

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "timestamp") {
      return sortDir === "asc"
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp);
    } else {
      return sortDir === "asc"
        ? (a[sortBy] ?? 0) - (b[sortBy] ?? 0)
        : (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
    }
  });

  // Paginate
  const pagedRows = sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Coin options from data
  const coinOptions = Array.from(new Set(rows.map(r => r.coin)));

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Transaction History
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            select
            label="Coin"
            value={filterCoin}
            onChange={e => setFilterCoin(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {coinOptions.map(c => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {TYPE_OPTIONS.map(t => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date (YYYY-MM-DD)"
            value={filterDate}
            type="date"
            onChange={e => setFilterDate(e.target.value)}
            sx={{ minWidth: 170 }}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => downloadCSV("transactions.csv", sortedRows)}
          >
            Download CSV
          </Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "timestamp"}
                  direction={sortDir}
                  onClick={() => {
                    setSortBy("timestamp");
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  }}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Coin</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "amount"}
                  direction={sortDir}
                  onClick={() => {
                    setSortBy("amount");
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  }}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map(row => (
              <TableRow key={row._id}>
                <TableCell>
                  {new Date(row.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{row.coin}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell align="right">{row.amount}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </Paper>
    </Container>
  );
}