// controllers/customerSupport.js
const mongoose = require('mongoose');
const CustomerInquiry = require('../models/CustomerInquiries');
const Customer = require('../models/Customers');

// Valid problem types for validation
const VALID_PROBLEM_TYPES = [
  'Orders',
  'Products',
  'Shipping & Delivery',
  'Payment',
  'Website Bug',
  'Feedback & Suggestion',
  'Other'
];

/**
 * POST /api/support/inquiries
 * Create a new customer inquiry (public endpoint - guests allowed)
 * Body: { sender_name, sender_phone, sender_email?, problem_type, details }
 */
exports.createInquiry = async (req, res) => {
  try {
    const { sender_name, sender_phone, sender_email, problem_type, details } = req.body;

    // Validate required fields
    if (!sender_name || !sender_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sender name is required'
      });
    }

    if (!sender_phone || !sender_phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sender phone is required'
      });
    }

    if (!problem_type || !VALID_PROBLEM_TYPES.includes(problem_type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid problem type is required'
      });
    }

    if (!details || !details.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Details are required'
      });
    }

    if (details.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Details cannot exceed 500 characters'
      });
    }

    // Create new inquiry
    const inquiry = await CustomerInquiry.create({
      sender_name: sender_name.trim(),
      sender_phone: sender_phone.trim(),
      sender_email: sender_email ? sender_email.trim() : null,
      problem_type,
      details: details.trim(),
      status: 'Unresolved'
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully. We will get back to you soon!',
      inquiry_id: inquiry._id
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error occurred while submitting your inquiry'
    });
  }
};

/**
 * GET /api/admin/support/inquiries
 * Get all inquiries with filtering and pagination (admin only)
 * Query params: page, limit, status, problem_type, search, date_from, date_to, sort
 */
exports.getAllInquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      problem_type,
      search,
      date_from,
      date_to,
      sort = '-createdAt'
    } = req.query;

    const filter = {};

    // Filter by status
    if (status && ['Unresolved', 'Resolving', 'Resolved'].includes(status)) {
      filter.status = status;
    }

    // Filter by problem type
    if (problem_type && VALID_PROBLEM_TYPES.includes(problem_type)) {
      filter.problem_type = problem_type;
    }

    // Search by sender name
    if (search && search.trim()) {
      filter.sender_name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by date range
    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) {
        filter.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    // Get inquiries
    const inquiries = await CustomerInquiry.find(filter)
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalItems = await CustomerInquiry.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Get status counts for summary
    const statusCounts = await CustomerInquiry.getStatusCounts();

    return res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        current_page: parseInt(page),
        per_page: limitNum,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: parseInt(page) < totalPages,
        has_prev_page: parseInt(page) > 1
      },
      summary: statusCounts
    });

  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inquiries'
    });
  }
};

/**
 * GET /api/admin/support/inquiries/:id
 * Get single inquiry details (admin only)
 */
exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    const inquiry = await CustomerInquiry.findById(id)
      .populate('resolved_by', 'name email')
      .lean();

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: inquiry
    });

  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inquiry details'
    });
  }
};

/**
 * PUT /api/admin/support/inquiries/:id/status
 * Update inquiry status (admin only)
 * Body: { status, admin_notes? }
 */
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    if (!status || !['Unresolved', 'Resolving', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Unresolved, Resolving, or Resolved)'
      });
    }

    const inquiry = await CustomerInquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Update status
    inquiry.status = status;

    // Update admin notes if provided
    if (admin_notes !== undefined) {
      inquiry.admin_notes = admin_notes.trim();
    }

    // If marking as resolved, set resolved info
    if (status === 'Resolved') {
      inquiry.resolved_at = new Date();
       const userId = req.userId;
      // Get admin customer ID
      if (userId) {
        const admin = await Customer.findOne({ clerkId: userId }).select('_id').lean();
        if (admin) {
          inquiry.resolved_by = admin._id;
        }
      }
    } else if (status === 'Unresolved') {
      inquiry.resolved_at = null;
      inquiry.resolved_by = null;
    }

    await inquiry.save();

    return res.status(200).json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      data: {
        _id: inquiry._id,
        status: inquiry.status,
        resolved_at: inquiry.resolved_at,
        admin_notes: inquiry.admin_notes
      }
    });

  } catch (error) {
    console.error('Error updating inquiry status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating inquiry status'
    });
  }
};

/**
 * DELETE /api/admin/support/inquiries/:id
 * Delete an inquiry (admin only)
 */
exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    const inquiry = await CustomerInquiry.findByIdAndDelete(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting inquiry'
    });
  }
};

/**
 * GET /api/admin/support/problem-types
 * Get list of valid problem types
 */
exports.getProblemTypes = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: VALID_PROBLEM_TYPES
  });
};