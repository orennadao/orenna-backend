// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';

// Import the server
import '../src/server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // For now, just respond to test connectivity
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'API is running on Vercel'
  });
}