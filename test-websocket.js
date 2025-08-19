// Simple WebSocket test script
// For Node.js testing - requires 'ws' package
// Alternatively, test from browser console at ws://localhost:3000/api/ws

try {
  const WebSocket = require('ws');
} catch (error) {
  console.log('❌ ws package not installed. Please run: npm install ws');
  console.log('💡 Alternatively, test from browser console:');
  console.log('');
  console.log('const ws = new WebSocket("ws://localhost:3000/api/ws");');
  console.log('ws.onopen = () => console.log("Connected");');
  console.log('ws.onmessage = (e) => console.log("Message:", e.data);');
  console.log('ws.send(JSON.stringify({type: "subscribe", channel: "payments"}));');
  console.log('');
  process.exit(1);
}

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/api/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Subscribe to payment events
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'payments'
  }));
  
  // Subscribe to indexer events
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'indexer'
  }));
  
  console.log('📡 Subscribed to payment and indexer channels');
});

ws.on('message', function message(data) {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received message:', {
      type: message.type,
      event: message.event,
      timestamp: message.timestamp,
      data: message.data ? Object.keys(message.data) : null
    });
  } catch (error) {
    console.log('📥 Raw message:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Closing WebSocket connection...');
  ws.close();
  process.exit(0);
});

console.log('🚀 Starting WebSocket test client...');
console.log('📍 Connecting to ws://localhost:3000/api/ws');
console.log('Press Ctrl+C to exit');