# 🔗 Clippy Setup for Colleagues

## One-Time Setup

1. **Unzip the folder** you received
2. **Run setup:**
   ```bash
   cd clippy
   ./setup.sh
   ```

That's it! The setup script handles Node.js version checks, permissions, and dependencies.

## Quick Start

### Option 1: Same Room (Local Network)
**Person running server:**
```bash
# Find your IP address
ifconfig | grep "inet 192"
# Start server with shared room code
CLIPPY_ROOM_CODE=our-secret ./start.sh server
```

**Everyone else:**
```bash
# Connect to the server (replace IP with actual IP)
CLIPPY_SERVER_URL=ws://192.168.1.100:3001 CLIPPY_ROOM_CODE=our-secret ./start.sh app
```

### Option 2: Test Locally First
```bash
./start.sh dev
```
This starts both server and app on your machine to test.

## What You'll See

- **Green dot** in system tray = connected and sharing
- **Red dot** = disconnected
- Right-click the tray icon for options
- Copy text or images on one machine → appears instantly on others!

### Terminal Messages
```
📋 Clipboard changed: "Hello World"
📤 Sharing text with our-secret room...

📋 Clipboard changed: Image (1920x1080)
📤 Sharing image with our-secret room...

📥 Received text from others: "Message from colleague"
📥 Received image from others: 800x600
```

## Troubleshooting

### "Permission denied" on start.sh
```bash
chmod +x start.sh
```

### "Port 3001 already in use"
```bash
PORT=4000 ./start.sh server
# Then others use: CLIPPY_SERVER_URL=ws://IP:4000 ./start.sh app
```

### "Electron cannot be opened" (Gatekeeper)
- Open Finder → Navigate to `node_modules/.bin/`
- Right-click `electron` → Choose "Open"
- Click "Open" when prompted
- Try starting the app again

### Firewall Dialog
When the server starts, macOS may ask "Accept incoming network connections?"
→ Click **Allow**

### Still Having Issues?
1. Make sure you both use the **exact same room code**
2. Check the server is running: `curl http://IP:3001` should respond
3. Try testing locally first with `./start.sh dev`

## How It Works

- **Server** = One person runs this, shares their IP
- **Room Code** = Shared password for your group  
- **Real-time** = Copy text anywhere, appears on all connected machines
- **Background** = Runs in system tray, no windows needed

🎉 **That's it!** Copy some text and watch the magic happen.
