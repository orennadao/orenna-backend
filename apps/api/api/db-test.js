// Database connection test endpoint
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Simple database connection test without importing Prisma (to avoid build issues)
    const { Client } = require('pg');
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        status: 'error',
        message: 'DATABASE_URL not configured',
        timestamp: new Date().toISOString()
      });
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    await client.end();

    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};