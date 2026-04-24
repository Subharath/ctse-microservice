const { getDb } = require('../db')
const { v4: uuidv4 } = require('uuid')

const COLLECTION = 'orders'

const initializeCollection = async () => {
  try {
    const collection = getDb().collection(COLLECTION)
    await collection.createIndex({ orderId: 1 }, { unique: true })
    await collection.createIndex({ userId: 1 })
  } catch (error) {
    if (error.code === 48) {
      return
    }

    throw error
  }
}

const createOrder = async (orderData) => {
  const collection = getDb().collection(COLLECTION)
  const now = new Date()
  const order = {
    orderId: uuidv4(),
    userId: orderData.userId,
    items: orderData.items || [],
    totalPrice: orderData.totalPrice || 0,
    shippingAddress: orderData.shippingAddress || {},
    notes: orderData.notes || '',
    status: 'pending',
    inventoryReserved: false,
    inventoryReleasedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(order)
  return { ...order, _id: result.insertedId }
}

const getOrderById = async (orderId) => {
  return getDb().collection(COLLECTION).findOne({ orderId })
}

const getOrdersByUserId = async (userId, page = 1, limit = 10) => {
  const collection = getDb().collection(COLLECTION)
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    collection
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray(),
    collection.countDocuments({ userId }),
  ])

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

const updateOrder = async (orderId, updateData) => {
  const result = await getDb().collection(COLLECTION).findOneAndUpdate(
    { orderId },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  return result?.value || result
}

const updateOrderStatus = async (orderId, status, extra = {}) => {
  return updateOrder(orderId, {
    status,
    ...extra,
  })
}

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  initializeCollection,
  updateOrder,
  updateOrderStatus,
}
