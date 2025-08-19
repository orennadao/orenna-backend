// Authentication - Get current user endpoint
const { withDatabase, dbUtils } = require('../../lib/db');
const jwt = require('jsonwebtoken');

async function meHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return dbUtils.errorResponse(res, 405, 'Method not allowed');
  }

  try {
    // Get token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.query.token;

    if (!token) {
      return dbUtils.errorResponse(res, 401, 'Authentication token required');
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return dbUtils.errorResponse(res, 401, 'Invalid or expired token');
    }

    const db = req.db;

    // Verify session exists and is not expired
    const session = await db.session.findUnique({
      where: { 
        id: decoded.sessionId,
        token: token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            projectRoles: {
              include: {
                project: true
              }
            },
            systemRoles: true,
            governanceTokens: true
          }
        }
      }
    });

    if (!session) {
      return dbUtils.errorResponse(res, 401, 'Session not found or expired');
    }

    const user = session.user;

    return dbUtils.successResponse(res, {
      user: {
        id: user.id,
        address: user.address,
        username: user.username,
        ensName: user.ensName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        projectRoles: user.projectRoles.map(role => ({
          id: role.id,
          role: role.role,
          project: {
            id: role.project.id,
            tokenId: role.project.tokenId,
            ownerAddress: role.project.ownerAddress,
            state: role.project.state
          }
        })),
        systemRoles: user.systemRoles.map(role => ({
          id: role.id,
          role: role.role,
          scope: role.scope,
          assignedAt: role.assignedAt
        })),
        governanceTokens: user.governanceTokens.length
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return dbUtils.errorResponse(res, 500, 'Failed to get user information', error.message);
  }
}

module.exports = withDatabase(meHandler);