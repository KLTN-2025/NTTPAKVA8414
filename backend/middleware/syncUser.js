// middleware/syncUser.js
import Customer from '../models/Customers.js';

export const syncUser = async (req, res, next) => {
  try {
    // Get Clerk user info from the authenticated request
    const { userId, sessionClaims } = req.auth;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Try to find existing customer
    let customer = await Customer.findOne({ clerkId: userId });

    if (!customer) {
      // First time user - create in MongoDB
      const firstName = sessionClaims?.firstName || '';
      const lastName = sessionClaims?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'User';

      customer = await Customer.create({
        clerkId: userId,
        email: sessionClaims?.email || '',
        name: fullName,
        account_status: 'active',
        lastLogin: new Date()
      });

      console.log('New customer created:', customer.email);
    } else {
      // Existing user - update last login
      customer.lastLogin = new Date();
      await customer.save();
    }

    // Attach customer to request for use in routes
    req.customer = customer;
    next();
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'User synchronization failed' });
  }
};