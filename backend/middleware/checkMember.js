const { clerkClient, getAuth } = require('@clerk/express')

// Custom middleware to check logged in status, for customers
exports.checkMemberStatus = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req)
    
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'User is not authenticated' })
    }

    const user = await clerkClient.users.getUser(userId)
    console.log('Authenticated customer')
    req.user = user
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}