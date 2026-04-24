import client from './client'

export const getUser = (userId) =>
  client.get(`/users/${userId}`)

export const updateUser = (userId, data) =>
  client.put(`/users/${userId}`, data)
