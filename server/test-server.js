// Simple test server to verify basic functionality
const express = require('express');
const app = express();
const PORT = 3001;

console.log('🚀 Starting simple test server...');

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    server: 'simple-test-server'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Simple test server running on http://localhost:${PORT}`);
  console.log(`🔗 Test health: http://localhost:${PORT}/health`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('🛑 Shutting down test server...');
  process.exit(0);
});
