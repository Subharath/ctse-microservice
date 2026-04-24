const trustedProxy = (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/health/')) {
    return next()
  }

  const gatewaySecret = process.env.GATEWAY_SHARED_SECRET || 'gateway-local-secret'
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'internal-local-secret'
  const gatewayAuth = req.headers['x-gateway-auth']
  const internalServiceName = req.headers['x-internal-service-name']
  const internalServiceSecret = req.headers['x-internal-service-secret']

  if (gatewayAuth === gatewaySecret) {
    req.authSource = 'gateway'
    return next()
  }

  if (internalServiceName && internalServiceSecret === internalSecret) {
    req.authSource = 'internal-service'
    req.serviceAuth = { name: internalServiceName }
    return next()
  }

  return res.status(403).json({
    success: false,
    message: 'Direct access to this service is not allowed',
    code: 'SERVICE_TRUST_REQUIRED',
  })
}

module.exports = trustedProxy
