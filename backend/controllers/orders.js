const mongoose = require("mongoose")
const CustomerOrder = require("../models/CustomerOrders")
const CustomerOrderItem = require("../models/CustomerOrderItems")
const Product = require("../models/Products")
const Customer = require("../models/Customers")
const { getAuth } = require("@clerk/express")

const MAX_CART_SIZE = 10

/**
 * Body:
 *  items: [{ product_id, quantity }]
 *  shippingDetails: { shipping_address, shipping_note, payment_method }
 */
exports.placeOrder = async (req, res) => {
  try {
    /* Optional auth */
    let customer_id = null
    const { userId } = getAuth(req)
    if (userId) {
      const customer = await Customer.findOne({ clerkId: userId })
        .select("_id")
        .lean()
      if (customer) customer_id = new mongoose.Types.ObjectId(customer._id)
      else
        return res.status(404).json({
          success: false,
          message: "Invalid user",
        })
    }

    const { items, shippingDetails } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cart is empty or invalid" 
    })
    }
    if (items.length > MAX_CART_SIZE){
      return res.status(400).json({ 
        success: false, 
        message: `Cart is too large (${items.length}/${MAX_CART_SIZE} items)`})
    }

    //Fetch products from DB for validation
    const productIds = items.map((i) => i.product_id)
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name current_stock selling_price")
      .lean()

    // Validation: check stock and calculate total
    let total = 0
    const updates = []

    for (const item of items) {
      const product = products.find(
        (p) => p._id.toString() === item.product_id
      )

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product_id}`,
        })
      }

      if (item.quantity > product.current_stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.current_stock}`,
        })
      }

      total += product.selling_price * item.quantity

      // Prepare stock update
      updates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { current_stock: -item.quantity } },
        },
      })
    }

    // Create order
    const newOrder = await CustomerOrder.create({
      customer_id: customer_id,
      payment_method:  shippingDetails.payment_method === "bank" ? "transfer" : "cod",
      shipping_address: shippingDetails.shipping_address,
      shipping_note: shippingDetails.shipping_note || "",
      total_amount: total,
    })

    // Create order items
    const orderItems = items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.product_id
      )
      return {
        order_id: newOrder._id,
        product_id: product._id,
        quantity: item.quantity,
        price: product.selling_price,
        discount: 0,
      }
    })

    await CustomerOrderItem.insertMany(orderItems)

    // Update stock
    await Product.bulkWrite(updates)

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order_id: newOrder._id,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
