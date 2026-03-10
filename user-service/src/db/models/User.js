/**
 * User Model
 * 
 * Purpose:
 * Collection structure and helper functions for users collection
 * 
 * Schema:
 * {
 *   _id: ObjectId,
 *   userId: string (UUID),
 *   email: string,
 *   name: string,
 *   role: string (user, admin),
 *   password: string (hashed),
 *   createdAt: date,
 *   updatedAt: date
 * }
 */

const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const COLLECTION = 'users';

// Initialize collection with indexes
const initializeCollection = async () => {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTION);
    
    // Create unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });
    
    // Create index on userId
    await collection.createIndex({ userId: 1 });
  } catch (error) {
    if (error.code === 48) {
      // Index already exists
      return;
    }
    throw error;
  }
};

const createUser = async (userData) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const user = {
    userId: uuidv4(),
    email: userData.email,
    name: userData.name || 'User',
    role: userData.role || 'user',
    password: userData.password,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collection.insertOne(user);
  return { ...user, _id: result.insertedId };
};

const getUserById = async (userId) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  
  const user = await collection.findOne({ userId });
  if (user) {
    delete user.password; // Don't return password
  }
  return user;
};

const getUserByEmail = async (email) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  
  return await collection.findOne({ email });
};

const updateUser = async (userId, updateData) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (result.value) {
    delete result.value.password;
  }
  return result.value;
};

const userExists = async (userId) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  
  const user = await collection.findOne({ userId });
  return !!user;
};

module.exports = {
  initializeCollection,
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  userExists
};
