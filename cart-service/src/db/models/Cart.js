const { getDb } = require('../db');

const COLLECTION = 'carts';

const calculateTotals = (items) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.itemTotal, 0);
  return { totalItems, totalPrice };
};

const initializeCollection = async () => {
  const collection = getDb().collection(COLLECTION);
  await collection.createIndex({ userId: 1 }, { unique: true });
};

const getCartByUserId = async (userId) => {
  return getDb().collection(COLLECTION).findOne({ userId });
};

const getOrCreateCart = async (userId) => {
  const collection = getDb().collection(COLLECTION);
  const existing = await collection.findOne({ userId });
  if (existing) {
    return existing;
  }

  const cart = {
    userId,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await collection.insertOne(cart);
  return cart;
};

const addItem = async (userId, itemData) => {
  const collection = getDb().collection(COLLECTION);
  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((item) => item.productId === itemData.productId);

  if (existingItem) {
    existingItem.quantity += itemData.quantity;
    existingItem.itemTotal = existingItem.quantity * existingItem.price;
  } else {
    cart.items.push({
      productId: itemData.productId,
      name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity,
      itemTotal: itemData.price * itemData.quantity
    });
  }

  const totals = calculateTotals(cart.items);
  cart.totalItems = totals.totalItems;
  cart.totalPrice = totals.totalPrice;
  cart.updatedAt = new Date();

  await collection.updateOne(
    { userId },
    { $set: { items: cart.items, totalItems: cart.totalItems, totalPrice: cart.totalPrice, updatedAt: cart.updatedAt } }
  );

  return cart;
};

const updateItemQuantity = async (userId, productId, quantity) => {
  const collection = getDb().collection(COLLECTION);
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((entry) => entry.productId === productId);

  if (!item) {
    return null;
  }

  item.quantity = quantity;
  item.itemTotal = item.price * quantity;

  const totals = calculateTotals(cart.items);
  cart.totalItems = totals.totalItems;
  cart.totalPrice = totals.totalPrice;
  cart.updatedAt = new Date();

  await collection.updateOne(
    { userId },
    { $set: { items: cart.items, totalItems: cart.totalItems, totalPrice: cart.totalPrice, updatedAt: cart.updatedAt } }
  );

  return cart;
};

const removeItem = async (userId, productId) => {
  const collection = getDb().collection(COLLECTION);
  const cart = await getOrCreateCart(userId);
  const nextItems = cart.items.filter((item) => item.productId !== productId);

  if (nextItems.length === cart.items.length) {
    return null;
  }

  const totals = calculateTotals(nextItems);
  cart.items = nextItems;
  cart.totalItems = totals.totalItems;
  cart.totalPrice = totals.totalPrice;
  cart.updatedAt = new Date();

  await collection.updateOne(
    { userId },
    { $set: { items: cart.items, totalItems: cart.totalItems, totalPrice: cart.totalPrice, updatedAt: cart.updatedAt } }
  );

  return cart;
};

const clearCart = async (userId) => {
  const collection = getDb().collection(COLLECTION);
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.totalItems = 0;
  cart.totalPrice = 0;
  cart.updatedAt = new Date();

  await collection.updateOne(
    { userId },
    { $set: { items: [], totalItems: 0, totalPrice: 0, updatedAt: cart.updatedAt } }
  );

  return cart;
};

module.exports = {
  initializeCollection,
  getCartByUserId,
  getOrCreateCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
};