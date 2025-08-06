#!/usr/bin/env node

const WebSocket = require('ws');

const serverUrl = process.env.CLIPPY_SERVER_URL || 'ws://localhost:3001';
const roomCode = process.env.CLIPPY_ROOM_CODE || 'clippy-default-room';

console.log(`Testing connection to ${serverUrl} with room code: ${roomCode}`);

const ws = new WebSocket(serverUrl);

ws.on('open', () => {
  console.log('✅ Connected to server');
  console.log('🔐 Sending authentication...');
  
  ws.send(JSON.stringify({
    type: 'auth',
    code: roomCode
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Received message:', message);
    
    if (message.type === 'auth_success') {
      console.log('✅ Authentication successful!');
      console.log('📋 Sending test clipboard content...');
      
      ws.send(JSON.stringify({
        type: 'clipboard',
        content: {
          type: 'text',
          data: 'Hello from test client!'
        },
        timestamp: Date.now()
      }));
      
      setTimeout(() => {
        console.log('🔄 Sending another test message...');
        ws.send(JSON.stringify({
          type: 'clipboard',
          content: {
            type: 'text',
            data: 'Second test message from client!'
          },
          timestamp: Date.now()
        }));
      }, 2000);
      
    } else if (message.type === 'auth_failed') {
      console.log('❌ Authentication failed!');
      process.exit(1);
    } else if (message.type === 'clipboard') {
      if (message.content.type === 'text') {
        console.log('📋 Received text content:', message.content.data);
      } else if (message.content.type === 'image') {
        console.log('📋 Received image:', `${message.content.width}x${message.content.height}`);
      } else {
        console.log('📋 Received content:', message.content.type);
      }
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep alive for testing
setTimeout(() => {
  console.log('⏰ Test completed, closing connection');
  ws.close();
}, 10000);
