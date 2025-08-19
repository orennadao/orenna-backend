// Simple health check endpoint
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check response
  return res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'orenna-api',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    message: 'Orenna API is running successfully on Vercel!'
  });
};