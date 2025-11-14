const { clerkClient, getAuth } = require('@clerk/express')

// Custom middleware to check user role
exports.checkAdminRole = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req)
    
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'User is not authenticated' })
    }

    const user = await clerkClient.users.getUser(userId)
    const userRole = user?.privateMetadata?.role
    const isAdmin = userRole === 'admin'

    if (!isAdmin) {
      return res.status(403).json({ error: 'Non-admins are forbidden' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}