export default function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = ['https://orennadao.com', 'https://alpha.orennadao.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({ 
    message: 'CORS test endpoint',
    origin: origin,
    timestamp: new Date().toISOString()
  });
}