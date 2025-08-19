// Authentication - Logout endpoint
const { withDatabase, dbUtils } = require('../../lib/db');
const jwt = require('jsonwebtoken');

async function logoutHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return dbUtils.errorResponse(res, 405, 'Method not allowed');
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return dbUtils.errorResponse(res, 401, 'Authentication token required');
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Even if token is invalid, we'll try to clean up
      return dbUtils.successResponse(res, { message: 'Logged out successfully' });
    }

    const db = req.db;

    // Delete the session
    await db.session.deleteMany({
      where: {
        id: decoded.sessionId,
        token: token
      }
    });

    return dbUtils.successResponse(res, { 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    return dbUtils.errorResponse(res, 500, 'Logout failed', error.message);
  }
}

module.exports = withDatabase(logoutHandler);