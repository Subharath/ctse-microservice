/**
 * Product Model
 * 
 * Purpose:
 * Collection structure and helper functions for products collection
 * 
 * Schema:
 * {
 *   _id: ObjectId,
 *   productId: string (UUID),
 *   name: string,
 *   description: string,
 *   price: number,
 *   stock: number,
 *   category: string,
 *   createdAt: date,
 *   updatedAt: date
 * }
 */

const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const COLLECTION = 'products';

const DEMO_PRODUCTS = [
  {
    name: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones for viva demos and daily use.',
    price: 149.99,
    stock: 25,
    category: 'electronics'
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact mechanical keyboard with tactile switches.',
    price: 89.5,
    stock: 18,
    category: 'accessories'
  },
  {
    name: 'USB-C Dock',
    description: 'Multi-port dock with HDMI, USB-A, and Ethernet.',
    price: 64.0,
    stock: 30,
    category: 'accessories'
  }
];

// Initialize collection with indexes
const initializeCollection = async () => {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTION);
    
    // Create index on productId
    await collection.createIndex({ productId: 1 });
    
    // Create index on category for filtering
    await collection.createIndex({ category: 1 });
  } catch (error) {
    if (error.code === 48) {
      return;
    }
    throw error;
  }
};

const createProduct = async (productData) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const product = {
    productId: uuidv4(),
    name: productData.name,
    description: productData.description || '',
    price: productData.price,
    stock: productData.stock || 0,
    category: productData.category || 'general',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collection.insertOne(product);
  return { ...product, _id: result.insertedId };
};

const getProductById = async (productId) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  
  return await collection.findOne({ productId });
};

const getProducts = async (page = 1, limit = 10, category = null, search = null) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const skip = (page - 1) * limit;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } }
    ];
  }

  const [products, total] = await Promise.all([
    collection.find(query).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query)
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const countProducts = async () => {
  const db = getDb();
  return db.collection(COLLECTION).countDocuments();
};

const seedDemoProducts = async () => {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  const existingCount = await collection.countDocuments();

  if (existingCount > 0) {
    return 0;
  }

  const timestamp = new Date();
  const docs = DEMO_PRODUCTS.map((product) => ({
    productId: uuidv4(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    createdAt: timestamp,
    updatedAt: timestamp
  }));

  await collection.insertMany(docs);
  return docs.length;
};

const updateStock = async (productId, quantity) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const result = await collection.findOneAndUpdate(
    { productId },
    {
      $inc: { stock: quantity },
      $set: { updatedAt: new Date() }
    },
    { returnDocument: 'after' }
  );

  return result?.value || result;
};

const checkStock = async (productId, requiredQuantity) => {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const product = await collection.findOne({ productId });
  
  if (!product) {
    return { available: false, reason: 'Product not found' };
  }

  if (product.stock < requiredQuantity) {
    return { 
      available: false, 
      reason: `Insufficient stock. Available: ${product.stock}`,
      available_stock: product.stock
    };
  }

  return { 
    available: true, 
    data: {
      productId,
      name: product.name,
      price: product.price,
      available_stock: product.stock
    }
  };
};

module.exports = {
  initializeCollection,
  createProduct,
  getProductById,
  getProducts,
  countProducts,
  seedDemoProducts,
  updateStock,
  checkStock
};
