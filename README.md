# Clippy - Clipboard Sharing App

A simple clipboard sharing application for macOS that allows you and your friends to share clipboard content in real-time.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Default room code and port
npm run server

# Or with custom settings
CLIPPY_ROOM_CODE=my-secret-room PORT=3001 npm run server
```

### 3. Start the App
```bash
# Default settings (connects to localhost:3001)
npm start

# Or with custom settings
CLIPPY_SERVER_URL=ws://your-server.com:3001 CLIPPY_ROOM_CODE=my-secret-room npm start
```

### 4. For Development (Both server and app)
```bash
npm run dev
```

## Distribution

### Build for Friends
```bash
npm run build
```

This creates a `.dmg` file in the `dist/` folder that your friends can install.

## Server Deployment Options

### Option 1: Local Network
Run the server on one person's always-on machine:
```bash
# Find your local IP
ifconfig | grep "inet "

# Start server
CLIPPY_ROOM_CODE=our-secret-room npm run server

# Others connect with your IP
CLIPPY_SERVER_URL=ws://192.168.1.100:3001 CLIPPY_ROOM_CODE=our-secret-room npm start
```

### Option 2: Cloud Server (DigitalOcean, etc.)
```bash
# On your server
git clone <this-repo>
cd clippy
npm install
CLIPPY_ROOM_CODE=our-secret-room PORT=3001 npm run server

# Everyone connects to your server IP
CLIPPY_SERVER_URL=ws://your-server-ip:3001 CLIPPY_ROOM_CODE=our-secret-room npm start
```

## How It Works

1. **Authentication**: All clients must use the same room code to join
2. **Real-time Sync**: When you copy something, it's instantly sent to all connected friends
3. **Background Operation**: Runs in the system tray, no windows needed
4. **Privacy**: Only works with people who have your room code

## Settings

The app reads configuration from environment variables:

- `CLIPPY_SERVER_URL`: WebSocket server URL (default: `ws://localhost:3001`)
- `CLIPPY_ROOM_CODE`: Room code for authentication (default: `clippy-default-room`)
- `PORT`: Server port (default: `3001`)

## Troubleshooting

### Can't Connect
- Make sure the server is running
- Check your room code matches exactly
- Verify the server URL is correct

### Not Sharing Clipboard
- Check the tray icon - green means connected
- Try copying some text to test
- Check the server logs for authentication issues

### Build Issues
- Make sure you have Xcode command line tools installed: `xcode-select --install`
- Node.js version should be 16 or higher

## Security Notes

- This is a quick-and-dirty solution for trusted friends
- The room code provides basic authentication
- Traffic is not encrypted (use HTTPS/WSS for production)
- Don't share sensitive data unless you trust your network
