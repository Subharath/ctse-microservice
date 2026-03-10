const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const COLLECTION = 'payments';

const initializeCollection = async () => {
  const collection = getDb().collection(COLLECTION);
  await collection.createIndex({ paymentId: 1 }, { unique: true });
  await collection.createIndex({ orderId: 1 });
  await collection.createIndex({ userId: 1 });
};

const createPayment = async (paymentData) => {
  const collection = getDb().collection(COLLECTION);
  const payment = {
    paymentId: uuidv4(),
    userId: paymentData.userId,
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    currency: paymentData.currency || 'USD',
    method: paymentData.method || 'unknown',
    status: paymentData.status || 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collection.insertOne(payment);
  return { ...payment, _id: result.insertedId };
};

const getPaymentById = async (paymentId) => getDb().collection(COLLECTION).findOne({ paymentId });

const getPaymentByOrderId = async (orderId) => getDb().collection(COLLECTION).findOne({ orderId });

const updatePaymentStatus = async (paymentId, status) => {
  const result = await getDb().collection(COLLECTION).findOneAndUpdate(
    { paymentId },
    {
      $set: {
        status,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  return result?.value || result;
};

module.exports = {
  initializeCollection,
  createPayment,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus
};