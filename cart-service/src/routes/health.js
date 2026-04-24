const express = require('express')
const router = express.Router()
const db = require('../db/db')

const checkDatabase = async () => {
  await db.getDb().command({ ping: 1 })
}

router.get('/', async (req, res) => {
  try {
    await checkDatabase()
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cart-service',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: 'connected',
      },
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'cart-service',
      error: error.message,
    })
  }
})

router.get('/live', (req, res) => {
  res.json({ status: 'alive' })
})

router.get('/ready', async (req, res) => {
  try {
    await checkDatabase()
    res.json({ status: 'ready' })
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      reason: error.message,
    })
  }
})

module.exports = router
