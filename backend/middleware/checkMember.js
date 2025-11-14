const {  getAuth } = require('@clerk/express')

// Custom middleware to check logged in status, for customers
exports.checkMemberStatus = async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated' })
    }
    req.userId = userId
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}