#!/bin/bash

# Simple start script for Clippy

echo "🔗 Starting Clippy Clipboard Share"
echo

# Check if user wants to start server or client
if [ "$1" = "server" ]; then
    echo "🖥️  Starting Clippy server..."
    ROOM_CODE=${CLIPPY_ROOM_CODE:-"clippy-default-room"}
    PORT=${PORT:-3001}
    echo "   Room Code: $ROOM_CODE"
    echo "   Port: $PORT"
    echo
    echo "⏳ Starting server (will show colleague instructions)..."
    echo
    npm run server
elif [ "$1" = "app" ] || [ "$1" = "client" ]; then
    echo "📱 Starting app..."
    SERVER_URL=${CLIPPY_SERVER_URL:-"ws://localhost:3001"}
    ROOM_CODE=${CLIPPY_ROOM_CODE:-"clippy-default-room"}
    echo "   Server: $SERVER_URL"
    echo "   Room Code: $ROOM_CODE"
    echo
    npm start
elif [ "$1" = "dev" ]; then
    echo "🚀 Starting both server and app..."
    npm run dev
else
    echo "Usage: $0 [server|app|dev]"
    echo
    echo "  server - Start the clipboard server"
    echo "  app    - Start the Electron app"
    echo "  dev    - Start both server and app"
    echo
    echo "Environment variables:"
    echo "  CLIPPY_ROOM_CODE    - Room code for authentication"
    echo "  CLIPPY_SERVER_URL   - WebSocket server URL"
    echo "  PORT               - Server port (server only)"
    echo
    echo "Examples:"
    echo "  $0 server"
    echo "  CLIPPY_ROOM_CODE=my-secret $0 server"
    echo "  CLIPPY_SERVER_URL=ws://192.168.1.100:3001 $0 app"
fi
