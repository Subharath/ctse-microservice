const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../db/db')

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001'
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'

const checkDatabase = async () => {
  await db.getDb().command({ ping: 1 })
}

const checkDependency = async (url) => {
  const response = await axios.get(`${url}/health`, { timeout: 3000 })
  return response.status === 200
}

router.get('/', async (req, res) => {
  try {
    await checkDatabase()
    const [userHealthy, productHealthy] = await Promise.allSettled([
      checkDependency(USER_SERVICE_URL),
      checkDependency(PRODUCT_SERVICE_URL),
    ])

    const dependencies = {
      user_service: userHealthy.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      product_service: productHealthy.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    }

    const allHealthy = Object.values(dependencies).every((status) => status === 'healthy')

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: 'connected',
      },
      dependencies,
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
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
