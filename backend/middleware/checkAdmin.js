const { clerkClient, getAuth } = require('@clerk/express')
const { redis } = require('../config/redis')

// Middleware to check if user is admin
exports.checkAdminRole = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'User is not authenticated' })
    }

    const cachedKey = `user:${userId}:role`
    let userRole = ''

    try {
      userRole = await redis.get(cachedKey)
    } catch (redisErr) {
      console.warn('Redis unavailable, skipping cache')
    }

    if (!userRole) {
      const user = await clerkClient.users.getUser(userId)
      userRole = user?.publicMetadata?.role
      try {
        if (userRole) {
          await redis.set(cachedKey, userRole)
        }
      } catch (redisErr) {
        console.warn('Redis unavailable, cannot cache role')
      }
    }

    const isAdmin = userRole === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Non-admins are forbidden' })
    }

    req.userId = userId
    next()
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
