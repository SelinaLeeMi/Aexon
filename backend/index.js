// Location: Aexon/Aexon/backend/index.js
// Full file — UPDATED to export the Express app and only listen when run directly.

const express = require('express');
const app = express();

// --- Your existing middleware/routes should remain here ---
// Example placeholder route (preserve/merge your real routes)
app.get('/api/hello', (req, res) => {
  res.json({ ok: true, message: 'Hello from backend!' });
});

// Export the app so a production wrapper can mount it without causing double-listen.
module.exports = app;

// If this file is executed directly (node backend/index.js), start the server.
// This keeps local dev behavior convenient while avoiding automatic listening when required.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend (dev) listening on port ${PORT}`);
  });
}