// Location: Aexon/Aexon/backend/prod-server.js
// Full file — PRODUCTION wrapper that mounts your exported backend app and serves frontend build.

const path = require('path');
const fs = require('fs');
const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();

// Serve frontend static files if build exists (frontend/build)
// Path is relative to backend directory
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    // Keep API routes available under /api
    if (req.path.startsWith('/api') || req.path.startsWith('/_next')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  console.log('Serving frontend static assets from', frontendBuildPath);
} else {
  console.log('No frontend build found at', frontendBuildPath);
}

// Try to require the backend app directly (recommended pattern: backend/index.js exports the Express app)
let mounted = false;
try {
  const backendApp = require(path.join(__dirname, 'index.js'));
  if (backendApp && typeof backendApp.use === 'function') {
    // Mount at /api so static frontend is served from root and API is namespaced
    app.use('/api', backendApp);
    mounted = true;
    console.log('Mounted backend app from backend/index.js at /api');
  }
} catch (err) {
  console.warn('Could not require backend/index.js directly:', err.message);
}

// Fallback probe (backwards-compat): try a few common locations if not mounted yet
if (!mounted) {
  const probePaths = [
    path.join(__dirname, 'app.js'),
    path.join(__dirname, 'server.js'),
    path.join(__dirname, '..', 'server', 'index.js'),
    path.join(__dirname, '..', 'server', 'app.js'),
    path.join(__dirname, '..', 'backend', 'app.js')
  ];

  for (const p of probePaths) {
    try {
      if (!fs.existsSync(p)) continue;
      const required = require(p);
      if (!required) continue;

      if (required && typeof required.use === 'function') {
        app.use('/api', required);
        mounted = true;
        console.log('Mounted Express app from', p, 'at /api');
        break;
      }
      if (required && required.app && typeof required.app.use === 'function') {
        app.use('/api', required.app);
        mounted = true;
        console.log('Mounted exported app property from', p, 'at /api');
        break;
      }
    } catch (err) {
      console.warn('Skipping probe path', p, ' — error requiring file:', err.message);
    }
  }
}

if (!mounted) {
  // Provide a minimal health check / fallback API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'production' });
  });
  console.log('No backend app mounted; provided fallback /api/health route.');
}

// Start the production server
app.listen(PORT, () => {
  console.log(`Production server listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});