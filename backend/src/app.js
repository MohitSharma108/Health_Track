'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { UPLOAD_DIR } = require('./services/storageProvider');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Served images (LocalStorage dev provider). In production this is S3 /
  // a CDN instead — see src/services/storageProvider.js.
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/profile', require('./routes/profile.routes'));
  app.use('/api/foods', require('./routes/foods.routes'));
  app.use('/api/meals', require('./routes/meals.routes'));
  app.use('/api/recipes', require('./routes/recipes.routes'));
  app.use('/api/weight', require('./routes/weight.routes'));
  app.use('/api/water', require('./routes/water.routes'));
  app.use('/api/favorites', require('./routes/favorites.routes'));
  app.use('/api/ai', require('./routes/ai.routes'));
  app.use('/api/analytics', require('./routes/analytics.routes'));
  app.use('/api/notifications', require('./routes/notifications.routes'));
  app.use('/api/reports', require('./routes/reports.routes'));

  // Serve Frontend directly so frontend + backend run as one unified service
  const path = require('path');
  const fs = require('fs');
  const candidates = [
    path.join(__dirname, '../../frontend'),
    path.join(__dirname, '../public'),
    path.join(__dirname, '../../backend/public'),
  ];
  const frontendDir = candidates.find((d) => fs.existsSync(d) && (fs.existsSync(path.join(d, 'nourish-selfhosted.html')) || fs.existsSync(path.join(d, 'index.html')))) || path.join(__dirname, '../public');

  app.use(express.static(frontendDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
      return next();
    }
    const htmlFile = fs.existsSync(path.join(frontendDir, 'nourish-selfhosted.html'))
      ? path.join(frontendDir, 'nourish-selfhosted.html')
      : path.join(frontendDir, 'index.html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(htmlFile);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
