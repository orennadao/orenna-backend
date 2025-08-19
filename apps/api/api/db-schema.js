// Database schema inspection
const { withDatabase, dbUtils } = require('../lib/db');

async function schemaHandler(req, res) {
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
    const db = req.db;

    // Get all tables in the database
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    // Get sample data from User table if it exists
    const userExists = tables.some(t => t.table_name === 'User');
    let sampleUser = null;
    let userCount = 0;

    if (userExists) {
      try {
        userCount = await db.user.count();
        if (userCount > 0) {
          sampleUser = await db.user.findFirst({
            select: {
              id: true,
              address: true,
              username: true,
              createdAt: true
            }
          });
        }
      } catch (error) {
        console.log('Error getting user data:', error.message);
      }
    }

    return dbUtils.successResponse(res, {
      database: 'Connected to Neon PostgreSQL',
      tablesCount: tables.length,
      tables: tables.map(t => t.table_name),
      sampleData: {
        users: {
          count: userCount,
          sample: sampleUser
        }
      }
    });

  } catch (error) {
    console.error('Schema inspection error:', error);
    return dbUtils.errorResponse(res, 500, 'Failed to inspect database schema', error.message);
  }
}

module.exports = withDatabase(schemaHandler);