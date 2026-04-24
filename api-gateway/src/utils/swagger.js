const PORT = process.env.PORT || 8000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`;

const createOperation = (summary, tag, secured = true) => {
  const operation = {
    tags: [tag],
    summary,
    responses: {
      200: {
        description: 'Successful response'
      },
      400: {
        description: 'Validation failed'
      },
      401: {
        description: 'Unauthorized'
      },
      403: {
        description: 'Forbidden'
      },
      404: {
        description: 'Not found'
      },
      503: {
        description: 'Service unavailable'
      }
    }
  };

  if (secured) {
    operation.security = [{ BearerAuth: [] }];
  }

  return operation;
};

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CTSE API Gateway',
    version: '1.0.0',
    description: 'Gateway-level API documentation for all exposed microservice endpoints.'
  },
  servers: [
    {
      url: serverUrl,
      description: 'API Gateway'
    }
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Products' },
    { name: 'Orders' },
    { name: 'Payments' },
    { name: 'Carts' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/health': {
      get: createOperation('Gateway health with dependency checks', 'Health', false)
    },
    '/health/live': {
      get: createOperation('Gateway liveness probe', 'Health', false)
    },
    '/health/ready': {
      get: createOperation('Gateway readiness probe', 'Health', false)
    },
    '/api/auth/register': {
      post: createOperation('Register new user', 'Auth', false)
    },
    '/api/auth/login': {
      post: createOperation('Login user', 'Auth', false)
    },
    '/api/auth/refresh': {
      post: createOperation('Refresh authentication token', 'Auth', false)
    },
    '/api/users/{userId}': {
      get: createOperation('Get user profile', 'Users'),
      put: createOperation('Update user profile', 'Users')
    },
    '/api/users/{userId}/exists': {
      get: createOperation('Check user exists', 'Users')
    },
    '/api/products': {
      get: createOperation('List products', 'Products')
    },
    '/api/products/{productId}': {
      get: createOperation('Get product details', 'Products')
    },
    '/api/products/{productId}/availability': {
      get: createOperation('Check product availability', 'Products')
    },
    '/api/products/{productId}/stock': {
      put: createOperation('Update product stock (admin)', 'Products')
    },
    '/api/orders': {
      post: createOperation('Create order', 'Orders')
    },
    '/api/orders/user/me': {
      get: createOperation('Get current user orders', 'Orders')
    },
    '/api/orders/user/{userId}': {
      get: createOperation('Get orders by user', 'Orders')
    },
    '/api/orders/{orderId}': {
      get: createOperation('Get order details', 'Orders')
    },
    '/api/orders/{orderId}/cancel': {
      post: createOperation('Cancel order', 'Orders')
    },
    '/api/orders/{orderId}/status': {
      put: createOperation('Update order status (admin)', 'Orders')
    },
    '/api/payments': {
      post: createOperation('Create payment', 'Payments')
    },
    '/api/payments/order/{orderId}': {
      get: createOperation('Get payment by order', 'Payments')
    },
    '/api/payments/{paymentId}': {
      get: createOperation('Get payment by id', 'Payments')
    },
    '/api/payments/{paymentId}/status': {
      put: createOperation('Update payment status (admin)', 'Payments')
    },
    '/api/carts/{userId}': {
      get: createOperation('Get cart', 'Carts'),
      delete: createOperation('Clear cart', 'Carts')
    },
    '/api/carts/{userId}/items': {
      post: createOperation('Add cart item', 'Carts')
    },
    '/api/carts/{userId}/items/{productId}': {
      put: createOperation('Update cart item quantity', 'Carts'),
      delete: createOperation('Remove cart item', 'Carts')
    }
  }
};

module.exports = swaggerSpec;
