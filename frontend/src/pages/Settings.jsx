import React from "react";
import {
  Box,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  Button
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import LanguageIcon from "@mui/icons-material/Language";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LockIcon from "@mui/icons-material/Lock";
import { useThemeMode } from "../ThemeContext";

export default function Settings() {
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <Box
      sx={{
        maxWidth: 420,
        mx: "auto",
        mt: 6,
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 1
      }}
    >
      <Typography variant="h4" fontWeight={700} mb={3}>
        Settings
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <FormControlLabel
        control={
          <Switch
            checked={themeMode === "dark"}
            onChange={e => setThemeMode(e.target.checked ? "dark" : "light")}
          />
        }
        label={
          <span>
            <Brightness4Icon sx={{ mr: 1 }} />
            Dark Mode
          </span>
        }
        sx={{ mb: 2 }}
      />
      <Divider sx={{ mb: 2 }} />
      <Typography fontWeight={600} sx={{ mb: 1 }}>
        <LanguageIcon sx={{ mr: 1 }} />
        Language
      </Typography>
      <Select value="en" disabled fullWidth sx={{ mb: 2 }}>
        <MenuItem value="en">English</MenuItem>
      </Select>
      <Divider sx={{ mb: 2 }} />
      <FormControlLabel
        control={<Switch checked={true} disabled />}
        label={
          <span>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            Notifications
          </span>
        }
        sx={{ mb: 2 }}
      />
      <Divider sx={{ mb: 2 }} />
      <Typography fontWeight={600} sx={{ mb: 1 }}>
        <LockIcon sx={{ mr: 1 }} />
        Privacy Level
      </Typography>
      <Select value="standard" disabled fullWidth sx={{ mb: 2 }}>
        <MenuItem value="standard">Standard</MenuItem>
      </Select>
      <Button variant="contained" color="primary" fullWidth>
        Save Settings
      </Button>
    </Box>
  );
}