const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const Customer = require('../models/Customers');

/**
 * @route   POST /api/auth/sync
 * @desc    Sync Clerk user data with local Customer collection
 * @access  Private (Clerk authenticated)
 */
router.post('/sync', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth; // Clerk user ID
    const { email, name, imageUrl, phone } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({ message: 'Missing required user information.' });
    }

    let customer = await Customer.findOne({ clerkId: userId });

    if (!customer) {
      // Create new customer record
      customer = await Customer.create({
        clerkId: userId,
        email,
        name,
        image_url: imageUrl || '',
        phone: phone || '',
      });
      return res.status(201).json({
        message: 'Customer created and synced successfully.',
        customer,
      });
    } else {
      // Update existing record (if needed)
      customer.last_login = new Date();
      await customer.save();

      return res.status(200).json({
        message: 'Customer already exists. Login date updated.',
        customer,
      });
    }
  } catch (error) {
    console.error('[SYNC ERROR]', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated customer profile
 * @access  Private (Clerk authenticated)
 */
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;

    const customer = await Customer.findOne({ clerkId: userId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found in database.' });
    }

    res.status(200).json({
      message: 'Customer profile retrieved successfully.',
      customer,
    });
  } catch (error) {
    console.error('[PROFILE ERROR]', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout endpoint (optional)
 * @access  Private (Clerk handled on frontend)
 */
router.post('/logout', requireAuth(), async (req, res) => {
  try {
    // Clerk sessions are managed client-side; no DB session needed here
    res.status(200).json({ message: 'Logout handled by Clerk on frontend.' });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;