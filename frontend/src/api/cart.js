import client from './client'

export const getCart = (userId) =>
  client.get(`/carts/${userId}`)

export const addItem = (userId, item) =>
  client.post(`/carts/${userId}/items`, item)

export const updateItem = (userId, productId, quantity) =>
  client.put(`/carts/${userId}/items/${productId}`, { quantity })

export const removeItem = (userId, productId) =>
  client.delete(`/carts/${userId}/items/${productId}`)

export const clearCart = (userId) =>
  client.delete(`/carts/${userId}`)
