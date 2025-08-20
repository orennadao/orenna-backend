// Simple test server for Railway debugging
const http = require('http');

const port = process.env.PORT || 3001;
const host = '0.0.0.0';

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/health/readiness') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port, timestamp: new Date().toISOString() }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Test server running',
    port,
    host,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }));
});

server.listen(port, host, () => {
  console.log(`Test server running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`PORT from env: ${process.env.PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});