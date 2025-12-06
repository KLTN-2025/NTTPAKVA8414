const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { clerkClient } = require('@clerk/express');
const { redis } = require('../config/redis');

require('dotenv').config();

if (!process.env.CLERK_DOMAIN) {
  throw new Error('Missing CLERK_DOMAIN environment variable');
}

const client = jwksClient({
  jwksUri: `https://${process.env.CLERK_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

exports.checkAdminRole = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    // Extract and clean token
    let token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    token = token.trim();

    // Validate token structure
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error(`Malformed JWT: expected 3 parts, got ${parts.length}`);
      return res.status(401).json({ error: 'Malformed token' });
    }

    // Verify JWT 
    jwt.verify(
      token,
      getKey,
      {
        issuer: `https://${process.env.CLERK_DOMAIN}`,
        algorithms: ['RS256'],
        clockTolerance: 60 
      },
      async (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err.name, '-', err.message);
          if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
          }
          if (err.name === 'NotBeforeError') {
            return res.status(401).json({ error: 'Token not yet valid' });
          }
          if (err.name === 'JsonWebTokenError' && err.message.includes('malformed')) {
            return res.status(401).json({ error: 'Token is malformed' });
          }
          
          return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decoded.sub;
        if (!userId) {
          return res.status(401).json({ error: 'Invalid token payload' });
        }

        let userRole = decoded.publicMetadata?.role || '';

        // Fallback to Redis if not in token
        if (!userRole) {
          const cachedKey = `user:${userId}:role`;
          
          try {
            userRole = await redis.get(cachedKey);
          } catch (redisErr) {
            console.warn('Redis unavailable:', redisErr.message);
          }

          // Final fallback to Clerk API
          if (!userRole) {
            try {
              const user = await clerkClient.users.getUser(userId);
              userRole = user?.publicMetadata?.role || '';

              if (userRole) {
                try {
                  await redis.set(cachedKey, userRole);
                } catch (redisErr) {
                  console.warn('Cannot cache role:', redisErr.message);
                }
              }
            } catch (clerkErr) {
              console.error('Failed to fetch user:', clerkErr.message);
              return res.status(500).json({ error: 'Failed to verify user role' });
            }
          }
        }

        // Check admin role
        const isAdmin = userRole === 'admin';
        if (!isAdmin) {
          return res.status(403).json({ 
            error: 'Access forbidden: Admin role required' 
          });
        }

        req.userId = userId;
        req.userRole = userRole;
        
        next();
      }
    );
  } catch (err) {
    console.error('Middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};