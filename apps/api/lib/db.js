// Database connection utility for Vercel serverless functions
const { PrismaClient } = require('@orenna/db');

// Global variable to cache the Prisma client across function invocations
let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
}

// Middleware to handle database errors
function withDatabase(handler) {
  return async (req, res) => {
    try {
      const db = getPrismaClient();
      req.db = db;
      return await handler(req, res);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Database connection failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Utility functions for common operations
const dbUtils = {
  // Handle BigInt serialization for JSON responses
  serializeBigInt: (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  },

  // Pagination helper
  getPagination: (req) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items
    const offset = parseInt(req.query.offset) || 0;
    return { limit, offset };
  },

  // Filter helper
  getFilters: (req, allowedFields = []) => {
    const filters = {};
    allowedFields.forEach(field => {
      if (req.query[field] !== undefined) {
        filters[field] = req.query[field];
      }
    });
    return filters;
  },

  // Error response helper
  errorResponse: (res, status, message, details = null) => {
    return res.status(status).json({
      error: message,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Success response helper
  successResponse: (res, data, meta = null) => {
    const response = {
      success: true,
      data: dbUtils.serializeBigInt(data),
      timestamp: new Date().toISOString()
    };
    if (meta) response.meta = meta;
    return res.status(200).json(response);
  }
};

module.exports = {
  getPrismaClient,
  withDatabase,
  dbUtils
};