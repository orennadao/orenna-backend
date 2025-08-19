// Authentication - Login endpoint
const { withDatabase, dbUtils } = require('../../lib/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function loginHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return dbUtils.errorResponse(res, 405, 'Method not allowed');
  }

  try {
    const { address, signature, message } = req.body || {};

    // Validate required fields
    if (!address || !signature || !message) {
      return dbUtils.errorResponse(res, 400, 'Missing required fields: address, signature, message');
    }

    // Validate Ethereum address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
      return dbUtils.errorResponse(res, 400, 'Invalid Ethereum address format');
    }

    // For now, we'll create a simple verification flow
    // In production, you'd verify the signature against the message
    console.log('Login attempt:', { address, message: message.substring(0, 50) + '...' });

    const db = req.db;

    // Find or create user
    let user = await db.user.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!user) {
      // Create new user
      user = await db.user.create({
        data: {
          address: address.toLowerCase()
        }
      });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const token = jwt.sign(
      { 
        userId: user.id, 
        address: user.address,
        sessionId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
        metadata: {
          userAgent: req.headers['user-agent'] || null,
          ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
          loginMethod: 'wallet-signature'
        }
      }
    });

    return dbUtils.successResponse(res, {
      user: {
        id: user.id,
        address: user.address,
        username: user.username,
        ensName: user.ensName,
        createdAt: user.createdAt
      },
      session: {
        token,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return dbUtils.errorResponse(res, 500, 'Login failed', error.message);
  }
}

module.exports = withDatabase(loginHandler);