const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const pulseRoutes = require('./routes/pulses');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.set('trust proxy', 1);

  if (!config.isTest) {
    app.use(morgan('combined'));
  }

  if (!config.disableRateLimit) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later'
        }
      }
    });
    app.use('/api/auth', limiter);
  }

  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/pulses', pulseRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
