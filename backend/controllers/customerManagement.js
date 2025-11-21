// controllers/customerManagement.js
const mongoose = require("mongoose");
const Customer = require("../models/Customers");
const { clerkClient } = require("@clerk/express");

/**
 * GET /api/admin/customers
 * Get all customers with pagination, search, and filters
 * Query params: { search, account_status, dateBegin, dateEnd, lastLoginBegin, lastLoginEnd, page, limit }
 * Requires admin role
 * Returns: {
 *   success: true | false,
 *   data: list of Customers,
 *   pagination: { currentPage, perPage, totalItems, totalPages, hasNextPage, hasPrevPage }
 * }
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      search,
      account_status,
      dateBegin,
      dateEnd,
      lastLoginBegin,
      lastLoginEnd,
    } = req.query;

    // Build filters
    const filters = {};
    
    // Only show customers (not admins)
    filters.role = "customer";
    
    // Don't show deleted accounts
    filters.is_deleted = false;

    // Search by username or email
    if (search && search.trim() !== "") {
      filters.$or = [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by account status
    const validAccountStatus = ["active", "inactive", "locked"];
    if (account_status && validAccountStatus.includes(account_status)) {
      filters.account_status = account_status;
    }

    // Filter by registration date (createdAt)
    if (dateBegin || dateEnd) {
      filters.createdAt = {};
      if (dateBegin && !isNaN(Date.parse(dateBegin))) {
        filters.createdAt.$gte = new Date(dateBegin);
      }
      if (dateEnd && !isNaN(Date.parse(dateEnd))) {
        filters.createdAt.$lte = new Date(dateEnd);
      }
    }

    // Filter by last login date
    if (lastLoginBegin || lastLoginEnd) {
      filters.last_login = {};
      if (lastLoginBegin && !isNaN(Date.parse(lastLoginBegin))) {
        filters.last_login.$gte = new Date(lastLoginBegin);
      }
      if (lastLoginEnd && !isNaN(Date.parse(lastLoginEnd))) {
        filters.last_login.$lte = new Date(lastLoginEnd);
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
    const skip = (page - 1) * limit;

    // Perform query
    const customers = await Customer.find(filters)
      .select("_id clerkId username email account_status createdAt last_login")
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalItems = await Customer.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * PUT /api/admin/customers/:id/lock
 * Lock a customer account
 * Requires admin role
 * Returns: { success: true | false, message: string, customer: object }
 */
exports.lockAccount = async (req, res) => {
  try {
    const customerId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }

    // Find customer
    const customer = await Customer.findById(customerId).select(
      "_id clerkId username email account_status role"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Prevent locking admin accounts
    if (customer.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot lock admin accounts",
      });
    }

    // Check if already locked
    if (customer.account_status === "locked") {
      return res.status(400).json({
        success: false,
        message: "Account is already locked",
      });
    }

    // Lock user in Clerk
    try {
      await clerkClient.users.lockUser(customer.clerkId);
    } catch (clerkError) {
      return res.status(500).json({
        success: false,
        message: "Failed to lock account in authentication service",
      });
    }

    // Update account_status in database
    customer.account_status = "locked";
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Account locked successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * PUT /api/admin/customers/:id/unlock
 * Unlock a customer account (set account_status to 'active' in DB and unlock in Clerk)
 * Requires admin role
 * Returns: { success: true | false, message: string, customer: object }
 */
exports.unlockAccount = async (req, res) => {
  try {
    const customerId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }

    // Find customer
    const customer = await Customer.findById(customerId).select(
      "_id clerkId username email account_status role"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if already active
    if (customer.account_status === "active") {
      return res.status(400).json({
        success: false,
        message: "Account is already active",
      });
    }

    // Unlock user in Clerk
    try {
      await clerkClient.users.unlockUser(customer.clerkId);
    } catch (clerkError) {
      return res.status(500).json({
        success: false,
        message: "Failed to unlock account in authentication service",
      });
    }

    // Update account_status in database
    customer.account_status = "active";
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Account unlocked successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};