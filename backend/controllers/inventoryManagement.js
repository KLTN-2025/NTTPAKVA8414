// controllers/inventoryController.js
const mongoose = require("mongoose");
const Product = require("../models/Products");

/**
 * GET /api/admin/inventory
 * Get inventory tracking data with search, filter, sort and pagination
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - search: Search by SKU or product name (partial match, case insensitive)
 * - stock_status: Filter by stock status ("normal", "low-stock", "out-of-stock")
 * - sortBy: Sort criterion ("name", "stock")
 * - sortOrder: 'asc' or 'desc' (default: 'asc')
 */
exports.getInventoryList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      is_deleted: { $ne: true }
    };

    // Search by SKU or name (partial match, case insensitive)
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      filter.$or = [
        { SKU: { $regex: searchTerm, $options: "i" } },
        { name: { $regex: searchTerm, $options: "i" } }
      ];
    }

    // Filter by stock status
    if (req.query.stock_status) {
      switch (req.query.stock_status) {
        case "normal":
          filter.current_stock = { $gt: 10 };
          break;
        case "low-stock":
          filter.current_stock = { $gte: 1, $lte: 10 };
          break;
        case "out-of-stock":
          filter.current_stock = 0;
          break;
      }
    }

    // Build sort options
    // Default: sort by stock quantity ascending, then by name ascending
    let sort = { current_stock: 1, name: 1 };
    
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "name":
          sort = { name: sortOrder, current_stock: 1 };
          break;
        case "stock":
          sort = { current_stock: sortOrder, name: 1 };
          break;
      }
    }

    // Query products
    const products = await Product.find(filter)
      .select("SKU name current_stock")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Format response with stock status
    const formattedProducts = products.map((product) => {
      let stockStatus;
      if (product.current_stock === 0) {
        stockStatus = "out-of-stock";
      } else if (product.current_stock >= 1 && product.current_stock <= 10) {
        stockStatus = "low-stock";
      } else {
        stockStatus = "normal";
      }

      return {
        _id: product._id,
        sku: product.SKU,
        name: product.name,
        stock: product.current_stock,
        stockStatus: stockStatus
      };
    });

    // Get total count for pagination
    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching inventory data",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/inventory/summary
 * Get inventory summary statistics
 */
exports.getInventorySummary = async (req, res) => {
  try {
    const filter = { is_deleted: { $ne: true } };

    const [totalProducts, normalStock, lowStock, outOfStock] = await Promise.all([
      Product.countDocuments(filter),
      Product.countDocuments({ ...filter, current_stock: { $gt: 10 } }),
      Product.countDocuments({ ...filter, current_stock: { $gte: 1, $lte: 10 } }),
      Product.countDocuments({ ...filter, current_stock: 0 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_products: totalProducts,
        normal_stock: normalStock,
        low_stock: lowStock,
        out_of_stock: outOfStock
      }
    });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching inventory summary",
      error: error.message
    });
  }
};