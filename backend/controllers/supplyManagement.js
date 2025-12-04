// controllers/supplyManagement.js
const mongoose = require('mongoose');
const Supplier = require('../models/Suppliers');
const SupplyOrder = require('../models/SupplyOrders');
const SupplyOrderItem = require('../models/SupplyOrderItems');
const Product = require('../models/Products');
const transactionService = require('../services/transactionService');

/**
 * GET /api/admin/suppliers
 * Get all suppliers with optional filtering
 */
exports.getSuppliers = async (req, res) => {
  try {
    const { name, email, phone, includeDeleted } = req.query;

    const filters = {};

    if (includeDeleted !== 'true') {
      filters.is_deleted = false;
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }
    if (email) {
      filters.email = { $regex: email, $options: 'i' };
    }
    if (phone) {
      filters.phone = { $regex: phone, $options: 'i' };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const suppliers = await Supplier.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalItems = await Supplier.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/suppliers/:id
 * Get a single supplier by ID
 */
exports.getSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findById(id).lean();

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * POST /api/admin/suppliers
 * Create a new supplier
 */
exports.createSupplier = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (email) {
      const existingSupplier = await Supplier.findOne({
        email: email.toLowerCase(),
        is_deleted: false
      });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'A supplier with this email already exists'
        });
      }
    }

    const newSupplier = await Supplier.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: newSupplier
    });
  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A supplier with this email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * PUT /api/admin/suppliers/:id
 * Update a supplier
 */
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (supplier.is_deleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a deleted supplier'
      });
    }

    if (email && email.toLowerCase() !== supplier.email) {
      const existingSupplier = await Supplier.findOne({
        email: email.toLowerCase(),
        is_deleted: false,
        _id: { $ne: id }
      });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'A supplier with this email already exists'
        });
      }
    }

    if (name && name.trim()) {
      supplier.name = name.trim();
    }
    if (email !== undefined) {
      supplier.email = email ? email.trim().toLowerCase() : null;
    }
    if (phone && phone.trim()) {
      supplier.phone = phone.trim();
    }

    await supplier.save();

    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A supplier with this email already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/admin/suppliers/:id
 * Soft-delete a supplier
 * Validates that no active supply orders (Draft or Ordered) exist
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (supplier.is_deleted) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is already deleted'
      });
    }

    const activeOrdersCount = await SupplyOrder.countDocuments({
      supplier_id: id,
      status: { $in: ['Draft', 'Ordered'] }
    });

    if (activeOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${activeOrdersCount} active supply order(s). Please complete or cancel them first.`
      });
    }

    supplier.is_deleted = true;
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * GET /api/admin/suppliers/:id/supply-orders
 * Get supply orders for a specific supplier
 */
exports.getSupplierOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const filters = { supplier_id: id };
    const validStatuses = ['Draft', 'Ordered', 'Received', 'Cancelled']

    if (status && validStatuses.includes(status)) {
      filters.status = status;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);
    const skip = (page - 1) * limit;

    const orders = await SupplyOrder.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalItems = await SupplyOrder.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: orders,
      supplier: {
        _id: supplier._id,
        name: supplier.name
      },
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/supply-orders
 * Get all supply orders with optional filtering
 * Query params: status, supplierId, dateBegin, dateEnd, page, limit
 */
exports.getAllSupplyOrders = async (req, res) => {
  try {
    const { status, supplierId, dateBegin, dateEnd } = req.query;

    const filters = {};
    const validStatuses = ['Draft', 'Ordered', 'Received', 'Cancelled']

    if (status && validStatuses.includes(status)) {
      filters.status = status;
    }

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      filters.supplier_id = supplierId;
    }

    if (dateBegin || dateEnd) {
      filters.createdAt = {};
      if (dateBegin && !isNaN(Date.parse(dateBegin))) {
        filters.createdAt.$gte = new Date(dateBegin);
      }
      if (dateEnd && !isNaN(Date.parse(dateEnd))) {
        filters.createdAt.$lte = new Date(dateEnd);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const orders = await SupplyOrder.find(filters)
      .populate('supplier_id', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalItems = await SupplyOrder.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/supply-orders/:id
 * Get a single supply order with its items
 */
exports.getSupplyOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply order ID format'
      });
    }

    const order = await SupplyOrder.findById(id)
      .populate('supplier_id', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    const items = await SupplyOrderItem.find({ so_id: id })
      .populate('product_id', 'name SKU current_stock')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * POST /api/admin/supply-orders
 * Create a new supply order with items
 * Body: {
 *   supplier_id,
 *   expected_arrival,
 *   notes,
 *   items: [{ product_id, quantity_ordered, unit_cost }]
 * }
 */
exports.createSupplyOrder = async (req, res) => {
  try {
    const { supplier_id, expected_arrival, notes, items } = req.body;

    if (!supplier_id || !mongoose.Types.ObjectId.isValid(supplier_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid supplier ID is required'
      });
    }

    if (!expected_arrival || isNaN(Date.parse(expected_arrival))) {
      return res.status(400).json({
        success: false,
        message: 'Valid expected arrival date is required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    const supplier = await Supplier.findById(supplier_id);
    if (!supplier || supplier.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found or has been deleted'
      });
    }

    const productIds = items.map(item => item.product_id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name SKU')
      .lean();

    let totalCostOrdered = 0;
    const orderItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${item.product_id}`
        });
      }

      const product = products.find(p => p._id.toString() === item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product_id}`
        });
      }

      if (!item.quantity_ordered || item.quantity_ordered < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product: ${product.name}`
        });
      }

      if (item.unit_cost === undefined || item.unit_cost < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid unit cost for product: ${product.name}`
        });
      }

      totalCostOrdered += item.quantity_ordered * item.unit_cost;

      orderItems.push({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost
      });
    }

    const uniqueProductIds = [...new Set(productIds)];
    if (uniqueProductIds.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate products in order items are not allowed'
      });
    }

    const [newOrder] = await SupplyOrder.create([{
      supplier_id,
      expected_arrival: new Date(expected_arrival),
      notes: notes || '',
      total_cost_ordered: totalCostOrdered,
      status: 'Draft'
    }]);

    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      so_id: newOrder._id
    }));

    await SupplyOrderItem.insertMany(itemsWithOrderId);

    return res.status(201).json({
      success: true,
      message: 'Supply order created successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * PUT /api/admin/supply-orders/:id
 * Update a supply order (items only editable while Draft)
 * Body: {
 *   expected_arrival,
 *   notes,
 *   items: [{ product_id, quantity_ordered, unit_cost }] // Only if status is Draft
 * }
 */
exports.updateSupplyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { expected_arrival, notes, items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply order ID format'
      });
    }

    const order = await SupplyOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    if (order.status === 'Received' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a supply order with status '${order.status}'`
      });
    }

    if (expected_arrival) {
      if (isNaN(Date.parse(expected_arrival))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expected arrival date'
        });
      }
      order.expected_arrival = new Date(expected_arrival);
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    if (items !== undefined) {
      if (order.status !== 'Draft') {
        return res.status(400).json({
          success: false,
          message: 'Items can only be modified while the order is in Draft status'
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one item is required'
        });
      }

      const productIds = items.map(item => item.product_id);
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id name SKU')
        .lean();

      let totalCostOrdered = 0;
      const orderItems = [];

      for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid product ID: ${item.product_id}`
          });
        }

        const product = products.find(p => p._id.toString() === item.product_id);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product_id}`
          });
        }

        if (!item.quantity_ordered || item.quantity_ordered < 1) {
          return res.status(400).json({
            success: false,
            message: `Invalid quantity for product: ${product.name}`
          });
        }

        if (item.unit_cost === undefined || item.unit_cost < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid unit cost for product: ${product.name}`
          });
        }

        totalCostOrdered += item.quantity_ordered * item.unit_cost;
        orderItems.push({
          so_id: order._id,
          product_id: item.product_id,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost
        });
      }

      const uniqueProductIds = [...new Set(productIds)];
      if (uniqueProductIds.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate products in order items are not allowed'
        });
      }

      await SupplyOrderItem.deleteMany({ so_id: order._id });
      await SupplyOrderItem.insertMany(orderItems);

      order.total_cost_ordered = totalCostOrdered;
      await order.save()
    }

    return res.status(200).json({
      success: true,
      message: 'Supply order updated successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * PATCH /api/admin/supply-orders/:id/status
 * Update supply order status
 * Body: {
 *   status: 'Ordered' | 'Received' | 'Cancelled',
 *   receivedItems: [{ product_id, quantity_received }] // Required when status is 'Received'
 * }
 */
exports.updateSupplyOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, receivedItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply order ID format'
      });
    }

    if (!['Ordered', 'Received', 'Cancelled'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Ordered, Received, or Cancelled'
      });
    }

    const order = await SupplyOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    const currentStatus = order.status;

    const validTransitions = {
      'Draft': ['Ordered', 'Cancelled'],
      'Ordered': ['Received', 'Cancelled'],
      'Received': [],
      'Cancelled': []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from '${currentStatus}' to '${newStatus}'`
      });
    }

    if (newStatus === 'Ordered') {
      if (!order.expected_arrival) {
        return res.status(400).json({
          success: false,
          message: 'Expected arrival date must be set before ordering'
        });
      }

      order.status = 'Ordered';
      order.ordered_at = new Date();
    }

    if (newStatus === 'Cancelled') {
      order.status = 'Cancelled';
      order.cancelled_at = new Date();
    }

    if (newStatus === 'Received') {
      if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Received items data is required'
        });
      }

      const orderItems = await SupplyOrderItem.find({ so_id: id });

      if (orderItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No items found in this supply order'
        });
      }

      const hasReceivedItem = receivedItems.some(item => item.quantity_received > 0);
      if (!hasReceivedItem) {
        return res.status(400).json({
          success: false,
          message: 'At least one item must have quantity received greater than 0'
        });
      }

      let totalCostReceived = 0;
      const stockUpdates = [];

      for (const orderItem of orderItems) {
        const receivedItem = receivedItems.find(
          ri => ri.product_id === orderItem.product_id.toString()
        );

        let quantityReceived = 0;

        if (receivedItem) {
          quantityReceived = receivedItem.quantity_received;

          if (quantityReceived > orderItem.quantity_ordered) {
            return res.status(400).json({
              success: false,
              message: `Quantity received cannot exceed quantity ordered for product ${orderItem.product_id}`
            });
          }

          if (quantityReceived < 0) {
            return res.status(400).json({
              success: false,
              message: `Quantity received cannot be negative for product ${orderItem.product_id}`
            });
          }
        }

        orderItem.quantity_received = quantityReceived;
        await orderItem.save();

        totalCostReceived += quantityReceived * orderItem.unit_cost;

        if (quantityReceived > 0) {
          stockUpdates.push({
            updateOne: {
              filter: { _id: orderItem.product_id },
              update: { $inc: { current_stock: quantityReceived } }
            }
          });
        }
      }

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates);
      }

      order.status = 'Received';
      order.received_at = new Date();
      order.total_cost_received = totalCostReceived;
    }

    await order.save();

    if (newStatus === 'Received') {
      const txResult = await transactionService.createSupplierPaymentTransaction(order);
      if (!txResult.success) {
        console.error('Failed to create supplier payment transaction:', txResult.error);
      } else if (txResult.skipped) {
        console.log('Supplier payment transaction skipped - no cost received');
      }
    }

    return res.status(200).json({
      success: true,
      message: `Supply order status updated to '${newStatus}'`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};