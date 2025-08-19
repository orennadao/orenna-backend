// Simple health check endpoint for Vercel
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

    // Health check response
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'orenna-api',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'production',
      message: 'Orenna API is running successfully on Vercel!',
      database: {
        connected: !!process.env.DATABASE_URL,
        provider: 'neon-postgresql'
      }
    };

    return res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};