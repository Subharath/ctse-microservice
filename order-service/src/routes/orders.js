const express = require('express')
const axios = require('axios')
const router = express.Router()
const logger = require('../utils/logger')
const { getContext } = require('../utils/context')
const OrderModel = require('../db/models/Order')

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001'
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-local-secret'

const buildInternalHeaders = (context, serviceName = 'order-service') => ({
  'Content-Type': 'application/json',
  'X-Request-ID': context.requestId,
  'X-User-ID': context.userId,
  'X-User-Role': context.userRole,
  'X-Internal-Service-Name': serviceName,
  'X-Internal-Service-Secret': INTERNAL_SERVICE_SECRET,
})

const callService = async (baseUrl, method, path, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${baseUrl}${path}`,
      timeout: 5000,
      headers,
      ...(data && { data }),
    })

    return { success: true, data: response.data, status: response.status }
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'Service unavailable' },
    }
  }
}

const validateAndPriceItems = async (context, items) => {
  let totalPrice = 0
  const validatedItems = []

  for (const item of items) {
    const response = await callService(
      PRODUCT_SERVICE_URL,
      'GET',
      `/products/${item.productId}/availability?quantity=${item.quantity}`,
      null,
      buildInternalHeaders(context)
    )

    if (!response.success || !response.data?.success) {
      return {
        success: false,
        status: response.status || 400,
        message: response.data?.message || response.data?.reason || `Product ${item.productId} is unavailable`,
        code: response.data?.code || 'INSUFFICIENT_STOCK',
      }
    }

    const productData = response.data.data
    const itemTotal = productData.price * item.quantity
    totalPrice += itemTotal

    validatedItems.push({
      productId: item.productId,
      name: productData.name,
      quantity: item.quantity,
      price: productData.price,
      itemTotal,
    })
  }

  return { success: true, validatedItems, totalPrice }
}

const reserveInventory = async (context, items) => {
  const reservedItems = []

  for (const item of items) {
    const response = await callService(
      PRODUCT_SERVICE_URL,
      'PUT',
      `/products/${item.productId}/stock`,
      {
        quantity: item.quantity,
        operation: 'decrease',
      },
      buildInternalHeaders(context)
    )

    if (!response.success || !response.data?.success) {
      return {
        success: false,
        failedItem: item,
        reservedItems,
        status: response.status || 503,
      }
    }

    reservedItems.push(item)
  }

  return { success: true, reservedItems }
}

const releaseInventory = async (context, items) => {
  for (const item of items) {
    const response = await callService(
      PRODUCT_SERVICE_URL,
      'PUT',
      `/products/${item.productId}/stock`,
      {
        quantity: item.quantity,
        operation: 'increase',
      },
      buildInternalHeaders(context)
    )

    if (!response.success || !response.data?.success) {
      return false
    }
  }

  return true
}

const transitionOrderStatus = async (order, nextStatus, context) => {
  const terminalWithRelease = new Set(['cancelled', 'failed'])
  const shouldReleaseInventory = terminalWithRelease.has(nextStatus) && order.inventoryReserved

  if (shouldReleaseInventory) {
    const released = await releaseInventory(context, order.items || [])
    if (!released) {
      return {
        success: false,
        status: 503,
        message: 'Failed to restore reserved inventory',
        code: 'INVENTORY_RELEASE_FAILED',
      }
    }
  }

  const updatedOrder = await OrderModel.updateOrderStatus(order.orderId, nextStatus, {
    inventoryReserved: shouldReleaseInventory ? false : order.inventoryReserved,
    inventoryReleasedAt: shouldReleaseInventory ? new Date() : order.inventoryReleasedAt || null,
  })

  return { success: true, order: updatedOrder }
}

router.post('/', async (req, res, next) => {
  try {
    const context = getContext(req)
    const { items, shippingAddress, notes } = req.body

    if (context.userId === 'anonymous') {
      return res.status(401).json({
        success: false,
        message: 'User ID is required (via authentication)',
        code: 'UNAUTHORIZED',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
        code: 'VALIDATION_ERROR',
      })
    }

    const userCheck = await callService(
      USER_SERVICE_URL,
      'GET',
      `/profile/${context.userId}/exists`,
      null,
      buildInternalHeaders(context)
    )

    if (!userCheck.success || !userCheck.data?.success || !userCheck.data.data?.exists) {
      return res.status(userCheck.status || 404).json({
        success: false,
        message: 'User not found. Cannot create order.',
        code: 'USER_NOT_FOUND',
      })
    }

    const pricedItems = await validateAndPriceItems(context, items)
    if (!pricedItems.success) {
      return res.status(pricedItems.status).json({
        success: false,
        message: pricedItems.message,
        code: pricedItems.code,
      })
    }

    const order = await OrderModel.createOrder({
      userId: context.userId,
      items: pricedItems.validatedItems,
      totalPrice: pricedItems.totalPrice,
      shippingAddress,
      notes,
    })

    const reservation = await reserveInventory(context, pricedItems.validatedItems)
    if (!reservation.success) {
      if (reservation.reservedItems.length > 0) {
        await releaseInventory(context, reservation.reservedItems)
      }

      await OrderModel.updateOrderStatus(order.orderId, 'failed', {
        inventoryReserved: false,
      })

      return res.status(reservation.status).json({
        success: false,
        message: `Stock reservation failed for product ${reservation.failedItem.productId}`,
        code: 'STOCK_UPDATE_FAILED',
      })
    }

    const updatedOrder = await OrderModel.updateOrder(order.orderId, {
      inventoryReserved: true,
    })

    logger.info('Order created successfully', {
      orderId: updatedOrder.orderId,
      userId: context.userId,
      itemCount: updatedOrder.items.length,
      totalPrice: updatedOrder.totalPrice,
      requestId: context.requestId,
    })

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const context = getContext(req)

    if (userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these orders',
        code: 'FORBIDDEN',
      })
    }

    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '10', 10)
    const orders = await OrderModel.getOrdersByUserId(userId, page, limit)

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params
    const context = getContext(req)
    const order = await OrderModel.getOrderById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      })
    }

    if (order.userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
        code: 'FORBIDDEN',
      })
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:orderId/cancel', async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { status = 'cancelled' } = req.body || {}
    const context = getContext(req)
    const order = await OrderModel.getOrderById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      })
    }

    const isOwner = order.userId === context.userId
    const isAdmin = context.userRole === 'admin'
    const isPaymentService = req.serviceAuth?.name === 'payment-service'

    if (!isOwner && !isAdmin && !isPaymentService) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
        code: 'FORBIDDEN',
      })
    }

    if (!['cancelled', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be cancelled or failed',
        code: 'VALIDATION_ERROR',
      })
    }

    const transition = await transitionOrderStatus(order, status, context)
    if (!transition.success) {
      return res.status(transition.status).json({
        success: false,
        message: transition.message,
        code: transition.code,
      })
    }

    res.json({
      success: true,
      message: `Order ${status} successfully`,
      data: transition.order,
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { status } = req.body
    const context = getContext(req)
    const order = await OrderModel.getOrderById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      })
    }

    const isAdmin = context.userRole === 'admin'
    const isPaymentService = req.serviceAuth?.name === 'payment-service'

    if (!isAdmin && !isPaymentService) {
      return res.status(403).json({
        success: false,
        message: 'Only admin or payment-service can update order status',
        code: 'FORBIDDEN',
      })
    }

    const allowedStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'failed']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
        code: 'VALIDATION_ERROR',
      })
    }

    const transition = await transitionOrderStatus(order, status, context)
    if (!transition.success) {
      return res.status(transition.status).json({
        success: false,
        message: transition.message,
        code: transition.code,
      })
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: transition.order,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
