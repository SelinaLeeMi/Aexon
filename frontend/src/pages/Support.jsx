import React from "react";
import { Container, Typography, Paper, Box, Button, TextField } from "@mui/material";

export default function Support() {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Customer Support
        </Typography>
        <Box mt={2}>
          <Typography>
            If you have questions or issues, fill in the form below and our support team will reply via email. For urgent help, email <b>support@aexon.com</b>.
          </Typography>
          <Box component="form" sx={{ mt: 3 }}>
            <TextField label="Email" fullWidth sx={{ mb: 2 }} />
            <TextField label="Subject" fullWidth sx={{ mb: 2 }} />
            <TextField label="Message" multiline rows={4} fullWidth sx={{ mb: 2 }} />
            <Button variant="contained" color="primary" fullWidth>
              Send Message
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}