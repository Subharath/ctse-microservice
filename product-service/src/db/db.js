/**
 * MongoDB Connection Utility
 * 
 * Purpose:
 * Initializes MongoDB connection using Atlas URI from .env
 * Provides centralized connection management
 * 
 * Usage:
 * const db = require('./db');
 * await db.connect();
 */

const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

let client = null;
let db = null;

const connect = async () => {
  if (client) {
    logger.debug('MongoDB already connected');
    return db;
  }

  try {
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

  } catch (error) {
    logger.error(`✗ MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connect() first');
  }
  return db;
};

const disconnect = async () => {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      logger.info('✓ MongoDB disconnected');
    }
  } catch (error) {
    logger.error(`✗ Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = {
  connect,
  getDb,
  disconnect
};
