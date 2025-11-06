const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Products')
const Customer = require('../models/Customers')
const CustomerOrder = require('../models/CustomerOrders')
const CustomerOrderItems = require('../models/CustomerOrderItems')
const { requireAuth } = require('@clerk/express')

const router = express.Router();

// Create new order
router.post('/', requireAuth(), async (req, res) => {
  const { userId } = req.auth; 
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch product data to validate price and stock
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    if (products.length !== items.length)
      throw new Error('Some products not found');

    // Build bulk operations
    const bulkOps = [];
    let total = 0;

    for (const item of items) {
      const product = products.find(p => p._id.equals(item.productId));
      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product?.name || 'unknown item'}`);
      }

      total += product.price * item.quantity;

      bulkOps.push({
        updateOne: {
          filter: { _id: item.productId, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    }

    // Apply inventory updates
    await Product.bulkWrite(bulkOps, { session });

    // Create the order
    const order = await Order.create(
      [{
        userId,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: products.find(p => p._id.equals(i.productId)).price
        })),
        total,
        status: 'pending'
      }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ message: 'Order created', order: order[0] });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router