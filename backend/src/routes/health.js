const express = require('express');
const router = express.Router();
const { getConnectionState } = require('../db');

router.get('/health', (req, res) => {
  const dbState = getConnectionState();
  
  if (dbState === 1) {
    const uptime = process.uptime();
    res.json({
      status: 'ok',
      db: 'up',
      uptime: Math.floor(uptime)
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      db: 'down'
    });
  }
});

module.exports = router;
