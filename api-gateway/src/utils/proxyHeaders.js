const getProxyHeaders = (req, extra = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Gateway-Auth': process.env.GATEWAY_SHARED_SECRET || 'gateway-local-secret'
  };

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  if (req.headers['x-user-id']) {
    headers['X-User-ID'] = req.headers['x-user-id'];
  }

  if (req.headers['x-user-email']) {
    headers['X-User-Email'] = req.headers['x-user-email'];
  }

  if (req.headers['x-user-role']) {
    headers['X-User-Role'] = req.headers['x-user-role'];
  }

  if (req.headers['x-request-id']) {
    headers['X-Request-ID'] = req.headers['x-request-id'];
  }

  return {
    ...headers,
    ...extra
  };
};

module.exports = getProxyHeaders;
