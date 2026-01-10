import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Paper } from "@mui/material";
import Theme from "../theme";
import TopHeader from "../components/TopHeader";
import PortfolioTotalCard from "../components/PortfolioTotalCard";

/**
 * Home page (Portfolio Dashboard)
 * - Mobile-first layout demonstrating token usage and the PortfolioTotalCard
 * - This page is intentionally minimal and focuses on the primary UX improvements:
 *   design tokens (theme), compact header, and portfolio total card.
 *
 * Integrate into your router at "/".
 */

export default function Home() {
  const handleTrade = () => {
    // Navigate to trade page (implement with your router)
    window.location.href = "/trade";
  };

  const handleWallet = () => {
    window.location.href = "/wallet";
  };

  return (
    <ThemeProvider theme={Theme}>
      <TopHeader onToggleSidebar={() => {}} onTrade={handleTrade} onWallet={handleWallet} />
      <Box sx={{ backgroundColor: Theme.palette.background.default, minHeight: "100vh", py: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PortfolioTotalCard onTrade={handleTrade} onDeposit={handleWallet} />
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Top Holdings</Typography>
                <Typography variant="body2" color="text.secondary">A compact list of your top assets will appear here. Click a holding to trade or view details.</Typography>
                {/* Placeholder: replace with holdings component */}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Allocation</Typography>
                <Typography variant="body2" color="text.secondary">Small allocation chart + legend (lazy-load chart library on demand).</Typography>
                {/* Placeholder: replace with allocation chart */}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Recent Activity</Typography>
                <Typography variant="body2" color="text.secondary">Latest deposits, withdrawals, and trades.</Typography>
                {/* Placeholder: replace with recent activity list */}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}