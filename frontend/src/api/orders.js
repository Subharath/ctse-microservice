import client from './client'

export const createOrder = (items, shippingAddress, notes) =>
  client.post('/orders', { items, shippingAddress, notes })

export const getMyOrders = () =>
  client.get('/orders/user/me')

export const getOrder = (orderId) =>
  client.get(`/orders/${orderId}`)

export const getUserOrders = (userId) =>
  client.get(`/orders/user/${userId}`)

export const cancelOrder = (orderId, status = 'cancelled') =>
  client.post(`/orders/${orderId}/cancel`, { status })

export const updateOrderStatus = (orderId, status) =>
  client.put(`/orders/${orderId}/status`, { status })
