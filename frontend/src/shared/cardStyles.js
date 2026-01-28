// shared/cardStyles.js
// Small helper that centralizes card/panel Sx so pages stay visually consistent.
// This file only exports a function that returns Sx using the provided theme.

export const cardSx = (theme) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  p: { xs: 2, md: 2.5 },
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 1px 6px rgba(12,18,25,0.04)",
});

export default cardSx;