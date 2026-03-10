/**
 * Order Model
 * 
 * Purpose:
 * Collection structure and helper functions for orders collection
 * 
 * Schema:
 * {
 *   _id: ObjectId,
 *   orderId: string (UUID),
 *   userId: string,
 *   items: [
 *     {
 *       productId: string,
 *       name: string,
 *       quantity: number,
 *       price: number
 *     }
 *   ],
 *   totalPrice: number,
 *   status: string (pending, confirmed, shipped, delivered),
 *   createdAt: date,
 *   updatedAt: date
 * }
 */

const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const COLLECTION = 'orders';

// Initialize collection with indexes
const initializeCollection = async () => {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTION);
    
    // Create index on orderId
    await collection.createIndex({ orderId: 1 });
    
    // Create index on userId for quick lookup
    await collection.createIndex({ userId: 1 });
  } catch (error) {
    if (error.code === 48) {
      return;
    }
    throw error;
  }
};

const createOrder = async (orderData) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const order = {
    orderId: uuidv4(),
    userId: orderData.userId,
    items: orderData.items || [],
    totalPrice: orderData.totalPrice || 0,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collection.insertOne(order);
  return { ...order, _id: result.insertedId };
};

const getOrderById = async (orderId) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  
  return await collection.findOne({ orderId });
};

const getOrdersByUserId = async (userId, page = 1, limit = 10) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    collection
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray(),
    collection.countDocuments({ userId })
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const updateOrderStatus = async (orderId, status) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const result = await collection.findOneAndUpdate(
    { orderId },
    {
      $set: { 
        status,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  return result.value;
};

module.exports = {
  initializeCollection,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus
};
