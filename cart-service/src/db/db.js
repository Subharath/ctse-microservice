const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

let client = null;
let db = null;

const connect = async () => {
  if (client) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not set in environment variables');
  }

  client = new MongoClient(mongoUri, {
    retryWrites: true,
    w: 'majority',
    serverSelectionTimeoutMS: 5000
  });

  await client.connect();
  db = client.db();
  logger.info('✓ MongoDB connected successfully');
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connect() first');
  }
  return db;
};

module.exports = {
  connect,
  getDb
};