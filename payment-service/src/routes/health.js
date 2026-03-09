/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'payment-service',
    version: '1.0.0',
    uptime: Math.floor(process.uptime())
  });
});

router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

module.exports = router;
