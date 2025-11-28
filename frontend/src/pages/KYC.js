import React, { useEffect, useState } from "react";
import { submitKyc, getMe } from "../api";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress
} from "@mui/material";

export default function KYC() {
  const [documentUrl, setDocumentUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [kycDoc, setKycDoc] = useState("");

  useEffect(() => {
    setLoading(true);
    getMe().then(r => {
      setStatus(r.data.kyc?.status || "not_submitted");
      setKycDoc(r.data.kyc?.documentUrl || "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await submitKyc({ documentUrl });
      setInfo("KYC document submitted for review!");
      setStatus("pending");
      setKycDoc(documentUrl);
      setDocumentUrl("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Submission failed."
      );
    }
    setLoading(false);
  };

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 10, maxWidth: 420, mx: "auto" }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          KYC Verification
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Status: <b>{status}</b>
        </Typography>
        {loading ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : status !== "approved" ? (
          <>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Document URL (image/pdf)"
                value={documentUrl}
                onChange={e => setDocumentUrl(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                placeholder="Paste link to your document/file here"
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={!documentUrl || loading}
              >
                Submit KYC
              </Button>
            </form>
            {info && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {info}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your KYC is approved!
            </Alert>
            <Typography>
              Document submitted: <br />
              <a href={kycDoc} target="_blank" rel="noopener noreferrer">
                {kycDoc}
              </a>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}