import client from './client'

export const getProducts = (params = {}) =>
  client.get('/products', { params })

export const getProduct = (productId) =>
  client.get(`/products/${productId}`)

export const checkAvailability = (productId, quantity = 1) =>
  client.get(`/products/${productId}/availability`, { params: { quantity } })

export const updateStock = (productId, quantity, operation) =>
  client.put(`/products/${productId}/stock`, { quantity, operation })
