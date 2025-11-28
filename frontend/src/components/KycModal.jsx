import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, TextField, MenuItem, Input, Avatar, CircularProgress, Alert
} from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const docTypes = [
  { label: "Passport", value: "passport" },
  { label: "Driver License", value: "driver_license" },
  { label: "National ID", value: "national_id" }
];

export default function KycModal({ open, onClose, onSubmit, status = "not_submitted", errorMsg = "" }) {
  const [docType, setDocType] = useState("");
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (setter) => e => {
    if (e.target.files && e.target.files[0]) setter(e.target.files[0]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!docType || !frontFile || (docType !== "passport" && !backFile)) {
      setError("Please fill all required fields and upload documents.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("frontFile", frontFile);
    if (backFile) formData.append("backFile", backFile);
    try {
      await onSubmit(formData);
    } catch (e) {
      setError("Failed to submit KYC documents.");
    }
    setSubmitting(false);
  };

  const canSubmit = docType && frontFile && (docType === "passport" || backFile);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VerifiedUserIcon color="primary" />
          <Typography fontWeight={700}>Identity Verification (KYC)</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {status === "verified" ? (
          <Box textAlign="center" py={3}>
            <CheckCircleIcon color="success" sx={{ fontSize: 54, mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="success.main">Verified</Typography>
            <Typography color="text.secondary">Your identity is verified.</Typography>
          </Box>
        ) : status === "pending" ? (
          <Box textAlign="center" py={3}>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography color="primary" fontWeight={700}>Verification Pending</Typography>
            <Typography color="text.secondary">Your documents are under review.</Typography>
          </Box>
        ) : status === "rejected" ? (
          <Box textAlign="center" py={3}>
            <ErrorIcon color="error" sx={{ fontSize: 54, mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="error.main">Rejected</Typography>
            <Typography color="text.secondary">{errorMsg || "Your documents could not be verified. Please try again."}</Typography>
          </Box>
        ) : (
          <>
            <Typography mb={2} color="text.secondary">
              Please select your document type and upload clear images of your legal identity document. Double-sided documents require both front and back.
            </Typography>
            <TextField
              select
              label="Document Type"
              value={docType}
              onChange={e => setDocType(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              required
            >
              {docTypes.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <Box mb={2}>
              <Typography fontWeight={500} mb={1}>Front Side</Typography>
              <Input
                type="file"
                inputProps={{ accept: "image/*,application/pdf" }}
                onChange={handleFile(setFrontFile)}
                fullWidth
                disabled={submitting}
                required
              />
              {frontFile && (
                <Box mt={1} display="flex" alignItems="center" gap={2}>
                  <Avatar src={URL.createObjectURL(frontFile)} variant="rounded" />
                  <Typography fontSize={13}>{frontFile.name}</Typography>
                </Box>
              )}
            </Box>
            {docType !== "passport" && (
              <Box mb={2}>
                <Typography fontWeight={500} mb={1}>Back Side</Typography>
                <Input
                  type="file"
                  inputProps={{ accept: "image/*,application/pdf" }}
                  onChange={handleFile(setBackFile)}
                  fullWidth
                  disabled={submitting}
                  required
                />
                {backFile && (
                  <Box mt={1} display="flex" alignItems="center" gap={2}>
                    <Avatar src={URL.createObjectURL(backFile)} variant="rounded" />
                    <Typography fontSize={13}>{backFile.name}</Typography>
                  </Box>
                )}
              </Box>
            )}
            {(error || errorMsg) && <Alert severity="error" mb={1}>{error || errorMsg}</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {status === "not_submitted" || status === "rejected" ? (
          <>
            <Button onClick={onClose} color="inherit" disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? <CircularProgress color="inherit" size={20} /> : "Submit"}
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="contained" color="primary">Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}