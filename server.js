const WebSocket = require('ws');
const express = require('express');
const os = require('os');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Room code for basic authentication
const ROOM_CODE = process.env.CLIPPY_ROOM_CODE || 'clippy-default-room';

const clients = new Set();

console.log(`Clippy server starting with room code: ${ROOM_CODE}`);

wss.on('connection', (ws) => {
  console.log('Client attempting to connect...');
  
  // Set authentication timeout
  const authTimeout = setTimeout(() => {
    if (!ws.authenticated) {
      console.log('Client failed to authenticate in time');
      ws.close();
    }
  }, 5000);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Handle authentication
      if (message.type === 'auth') {
        if (message.code === ROOM_CODE) {
          ws.authenticated = true;
          clearTimeout(authTimeout);
          clients.add(ws);
          console.log(`Client authenticated. Total clients: ${clients.size}`);
          ws.send(JSON.stringify({ type: 'auth_success' }));
        } else {
          console.log('Client provided wrong room code');
          ws.send(JSON.stringify({ type: 'auth_failed' }));
          ws.close();
        }
        return;
      }
      
      // Reject unauthenticated messages
      if (!ws.authenticated) {
        console.log('Rejecting message from unauthenticated client');
        ws.close();
        return;
      }
      
      // Handle clipboard sharing
      if (message.type === 'clipboard') {
        console.log(`Broadcasting clipboard content (${message.content.length} chars) from authenticated client`);
        
        // Broadcast to all other authenticated clients
        clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.authenticated) {
            client.send(JSON.stringify({
              type: 'clipboard',
              content: message.content,
              timestamp: message.timestamp || Date.now()
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    clearTimeout(authTimeout);
    clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3001;

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.error(`   Try: PORT=4000 npm run server`);
      process.exit(1);
    } else {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
  }
  
  const localIP = getLocalIP();
  
  console.log(`✅ Clippy clipboard server running on port ${PORT}`);
  console.log(`🔐 Room code: ${ROOM_CODE}`);
  console.log('');
  
  console.log('👥 FOR YOUR COLLEAGUE:');
  console.log('━'.repeat(60));
  console.log(`📋 Tell them to run this command:`);
  console.log('');
  console.log(`   CLIPPY_SERVER_URL=ws://${localIP}:${PORT} CLIPPY_ROOM_CODE=${ROOM_CODE} ./start.sh app`);
  console.log('');
  console.log(`📱 Or give them these details:`);
  console.log(`   Server IP: ${localIP}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Room Code: ${ROOM_CODE}`);
  console.log('━'.repeat(60));
  console.log('');
  console.log(`💡 To change room code: CLIPPY_ROOM_CODE=your-secret npm run server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
