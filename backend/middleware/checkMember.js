const { getAuth } = require('@clerk/express')
const { redis } = require('../config/redis')

// Custom middleware to check logged in status, for customers
exports.checkMemberStatus = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req)
    
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'User is not authenticated' })
    }
    req.userId = userId
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}