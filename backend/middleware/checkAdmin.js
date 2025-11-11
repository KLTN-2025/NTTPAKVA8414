//middleware/checkAdmin.js
const { getAuth } = require("@clerk/express");

// Middleware to check admin role
exports.checkAdminRole = (req, res, next) => {
  const { has } = getAuth(req);
  
  if (!has({ role: 'admin' })) {
    return res.status(403).json({ 
      success: false,
      message: 'Access forbidden. Admin role required.' 
    });
  }
  
  next();
};