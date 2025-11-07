const mongoose = require("mongoose");
const Cart = require("../models/Carts");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const { getAuth } = require("@clerk/express");

const MAX_CART_SIZE = 10

/**
 * Validate the content inside the cart
 * Body: [{ product_id, quantity }]   <-- make docs match this
 */
exports.validateCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array expected",
      });
    }

    if (items.length > MAX_CART_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Cart can't have more than ${MAX_CART_SIZE} items at once`,
      });
    }

    const pIDs = new Set();
    for (const it of items) {
      if (
        !it ||
        !it.product_id ||
        typeof it.quantity !== "number" ||
        it.quantity <= 0 ||
        !Number.isInteger(it.quantity)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid item format" });
      }
      if (!mongoose.Types.ObjectId.isValid(it.product_id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product_id: ${it.product_id}`,
        });
      }
      pIDs.add(String(it.product_id));
    }

    const idsArray = Array.from(pIDs);

    const foundProducts = await Product.find({ _id: { $in: idsArray } })
      .select("_id current_stock selling_price")
      .lean();

    const prodMap = new Map();
    for (const p of foundProducts) {
      prodMap.set(String(p._id), p);
    }

    const validationResults = items.map((item) => {
      const key = String(item.product_id);
      const p = prodMap.get(key);
      //This item no longer exists, marked as invalid
      if (!p) {
        return {
          product_id: item.product_id,
          valid: false,
          reason: "Product not found",
          exists: false,
          available_stock: 0,
          requested_quantity: item.quantity,
          current_price: null,
          in_stock: false,
        };
      }

      //Mark an item as valid depending on current stock
      const availableStock = p.current_stock ?? 0;
      return {
        product_id: item.product_id,
        available_stock: availableStock,
        requested_quantity: item.quantity,
        valid: availableStock >= item.quantity,
        current_price: p.selling_price ?? null,
        exists: true,
        in_stock: availableStock > 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: validationResults,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error validating cart",
      error: err.message,
    });
  }
};

/**
 * Get the items inside the remote cart
 * Require auth
 */
exports.getCart = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated user" });
    }

    const customer = await Customer.findOne({ clerkId: userId }).select(
      "_id"
    ).lean()
    const customerId = customer._id

    let cart = await Cart.findOne({ customer_id: customerId })
      .populate({
        path: "items.product_id",
        select: "name selling_price image_urls current_stock"
      })
      .lean();

    if (!cart) {
      // Create empty cart
      cart = {
        customer_id: customerId,
        items: [],
        total_amount: 0,
      };
    }

    // Format response
    const formattedCart = {
      items: cart.items.map((item) => ({
        product_id: item.product_id._id,
        name: item.product_id.name,
        image:
          item.product_id.image_urls && item.product_id.image_urls.length > 0
            ? item.product_id.image_urls[0]
            : null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        in_stock: item.product_id.current_stock > 0,
        available_stock: item.product_id.current_stock,
      })),
      total_amount: cart.total_amount,
      total_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    res.json({
      success: true,
      data: formattedCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

/**
 * Sync guest cart with server cart after login
 * Requires authentication
 *
 * Body: {
 *   guestItems: [{ product_id, quantity }],
 *   overrideRemoteCart: Boolean (true = override server, false = use server)
 * }
 */
exports.syncCart = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        message: "Unauthenticated user",
      });
    }
    const { guestItems, overrideRemoteCart } = req.body;

    if (!Array.isArray(guestItems)) {
      return res.status(400).json({
        success: false,
        message: "Item list must be an array",
      });
    }
    if (guestItems.length > MAX_CART_SIZE) {
      return res.status(400).json({
        success: false,
        message: "Cart can't have more than 10 items at once",
      });
    }

    // Find existing cart on server
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const customerId = customer._id;
    let cart = await Cart.findOne({ customer_id: customerId });

    if (!cart) {
      cart = new Cart({
        customer_id: customerId,
        items: [],
      });
    }

    //Array for storing dropped products
    const droppedProducts = [];

    //MAIN LOGIC
    //PATH 1: OVERRIDE THE REMOTE VERSION WITH LOCAL ONE
    if (overrideRemoteCart) {
      cart.items = [];

      //Filter cart items with non-zero quantity and get their ids
      const validGuestItems = guestItems.filter((item) => item.quantity > 0);
      const localCartItemIds = validGuestItems.map((item) =>
        String(item.product_id)
      );
      if (localCartItemIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Cart is empty",
          data: {
            total_items: 0,
            total_amount: 0,
            droppedProducts: [],
            dropCount: 0,
          },
        });
      }

      /**
       * Query DB for products matching the ids AND with available stock
       * Return a list of specified products, with the latest stock quantities and selling prices
       * This will be used to check against the cart
       */
      const productsAvailableForPurchase = await Product.find({
        _id: { $in: localCartItemIds },
        current_stock: { $gt: 0 },
      })
        .select("_id name current_stock selling_price")
        .lean();

      const availableProdMap = new Map();
      for (const prod of productsAvailableForPurchase) {
        availableProdMap.set(String(prod._id), prod);
      }

      for (const guestItem of validGuestItems) {
        const p = availableProdMap.get(String(guestItem.product_id));
        if (p) {
          cart.items.push({
            product_id: p._id,
            quantity: Math.min(p.current_stock, guestItem.quantity),
            price: p.selling_price,
          });
        } else {
          droppedProducts.push(guestItem.product_id);
        }
      }

      cart.calculateTotal();
      await cart.save();

      return res.json({
        success: true,
        message: "Using local cart",
        data: {
          total_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: cart.total_amount,
          droppedProducts: droppedProducts,
          dropCount: droppedProducts.length,
        },
      });
    }
    //PATH 2: USE THE REMOTE VERSION
    else if (cart.items.length > 0) {
      //Get the ids. No quantity filter, because remote version ones are guaranteed to be non-zero
      const remoteCartItemIds = cart.items.map((item) => String(item.product_id));
      if (remoteCartItemIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Cart is empty",
          data: {
            total_items: 0,
            total_amount: 0,
            droppedProducts: [],
            dropCount: 0,
          },
        });

      }
      /**
       * Query DB for products matching the ids AND with available stock
       * Return a list of specified products, with the latest stock quantities and selling prices
       * This will be used to check against the cart
       */
      const productsAvailableForPurchase = await Product.find({
        _id: { $in: remoteCartItemIds },
        current_stock: { $gt: 0 },
      })
        .select("_id name current_stock selling_price")
        .lean();

      const availableProdMap = new Map();
      for (const prod of productsAvailableForPurchase) {
        availableProdMap.set(String(prod._id), prod);
      }

      const updatedProdList = [];
      for (const item of cart.items) {
        const p = availableProdMap.get(String(item.product_id));
        if (p) {
          updatedProdList.push({
            product_id: p._id,
            quantity: Math.min(p.current_stock, item.quantity),
            price: p.selling_price,
          });
        } else {
          droppedProducts.push(item.product_id);
        }
      }
      cart.items = updatedProdList;

      cart.calculateTotal();
      await cart.save();

      return res.json({
        success: true,
        message: "Using remote cart",
        data: {
          total_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: cart.total_amount,
          droppedProducts: droppedProducts,
          dropCount: droppedProducts.length,
        },
      });
    }
    //PATH 3: None of the above
    else {
      return res.json({
        success: true,
        message: "Remote cart is empty",
        data: {
          total_items: 0,
          total_amount: 0,
          droppedProducts: [],
          dropCount: 0,
        },
      });
    }
  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing cart",
      error: error.message,
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        message: "Unauthenticated user",
      });
    }
    // Find existing cart on server
    const customer = await Customer.findOne({ clerkId: userId }).select("_id").lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customerId = customer._id;
    let cart = await Cart.findOne({ customer_id: customerId });

    if (cart) {
      cart.items = []
      cart.total_amount = 0
      await cart.save()
    }
    else {
      res.status(404).json({ message: 'No cart found with this customer ID' })
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + String(err)})
  }
}