import client from './client'

export const createPayment = (data) =>
  client.post('/payments', data)

export const getPaymentByOrder = (orderId) =>
  client.get(`/payments/order/${orderId}`)

export const getPayment = (paymentId) =>
  client.get(`/payments/${paymentId}`)

export const updatePaymentStatus = (paymentId, status) =>
  client.put(`/payments/${paymentId}/status`, { status })
