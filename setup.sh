#!/bin/bash

echo "🔗 Clippy Setup Script"
echo "======================"
echo

# Check Node version
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    echo "❌ Node.js not found. Please install Node.js 18 or 20:"
    echo "   https://nodejs.org/"
    echo "   or use nvm: nvm install 20 && nvm use 20"
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [[ $NODE_MAJOR -lt 18 ]]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node 18 or 20:"
    echo "   nvm install 20 && nvm use 20"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Remove quarantine attributes that might block Electron
echo "🔓 Removing macOS quarantine attributes..."
xattr -dr com.apple.quarantine . 2>/dev/null || true

# Make scripts executable
echo "🔧 Setting script permissions..."
chmod +x start.sh test-client.js 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
if ! npm install; then
    echo "❌ npm install failed. Try:"
    echo "   rm -rf node_modules package-lock.json"
    echo "   npm install"
    exit 1
fi

echo
echo "✅ Setup complete!"
echo
echo "🚀 Quick Start:"
echo "   ./start.sh server    # Start the server (one person)"
echo "   ./start.sh app       # Start the app (everyone)"
echo "   ./start.sh dev       # Start both (for testing)"
echo
echo "🌐 For network sharing:"
echo "   1. Find your IP: ifconfig | grep 'inet 192'"
echo "   2. Server: CLIPPY_ROOM_CODE=secret ./start.sh server"
echo "   3. Others: CLIPPY_SERVER_URL=ws://YOUR.IP.HERE:3001 CLIPPY_ROOM_CODE=secret ./start.sh app"
echo
echo "🔧 Troubleshooting:"
echo "   • Port in use: PORT=4000 ./start.sh server"
echo "   • Electron blocked: Open Finder → Right-click electron binary → Open"
echo "   • Firewall prompt: Click 'Allow' when asked about network connections"
echo
