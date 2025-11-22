const express = require('express')
const router = express.Router()
const { requireAuth } = require('@clerk/express')
const Customer = require('../../models/Customers') 

/**
 * @route   PUT /api/customers/me
 * @desc    Update the current logged-in user's application-specific profile data
 * @access  Private (Requires Clerk authentication)
 */
router.put('/me', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId

    const { phone } = req.body 

    const updateData = {}
    if (phone) {
      updateData.phone = phone
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided.' })
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { clerkId: clerkId }, 
      { $set: updateData }, 
      { new: true, runValidators: true } 
    )

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer profile not found.' })
    }

    // Send back the updated profile
    res.status(200).json({
      message: 'Profile updated successfully.',
      customer: updatedCustomer,
    })

  } catch (error) {
    console.error('[CUSTOMER UPDATE ERROR]', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    res.status(500).json({ message: 'Internal server error.' })
  }
})

module.exports = router