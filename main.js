const { app, Menu, Tray, clipboard, dialog, nativeImage } = require('electron');
const WebSocket = require('ws');
const path = require('path');

let tray;
let ws;
let lastClipboard = '';
let lastClipboardHash = '';
let isConnected = false;
let roomCode = 'clippy-default-room';
let serverUrl = 'ws://localhost:3001';

// Create simple tray icons using base64 encoded PNGs
function createTrayIcon(connected = false) {
  // Simple 16x16 PNG icons encoded in base64
  const connectedIcon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwiChYWFhYWFhVpYWFhYWKiFWlhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFiohdCu';
  const disconnectedIcon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwiChYWFhYWFhVpYWFhYWKiFWlhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFhYqIWFhYVaWFhYWKiFhYWFWlhYWFiohdCu';
  
  // For now, use a simple emoji-style approach
  const iconData = connected ? 
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAAGdJREFUOI3t0zEKwjAYQOGXoINDh3bp4OLk4OA5HBzc3Bwc3FwdHBwc3BwcHNzcHBwcHNzcHBxcHRwcHBwc3BwcHNzcHBwcXB0cHBwcHNzcHBwc3BwcHBxcHRwcHBwc3BwcHNzcHBwcXB0cnzCQJy82yqOoAAAAAElFTkSuQmCC' :
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAAGdJREFUOI3t0zEOwjAMQOEX1AFGRlaWjiwsjIwsLIyMLCyMrCwsjIwsLIyMLCyMrCwsjIwsLIyMLCyMrCwsjIwsLIyMLCyMrCwsjIwsLIyMLCyMrCwsjIwsLIyMLCyMrCwsjIwsLIys/ADB8heF2BQCNQAAAABJRU5ErkJggg==';
  
  return nativeImage.createFromDataURL(iconData);
}

function createConnection() {
  console.log(`Attempting to connect to ${serverUrl}`);
  
  if (ws) {
    ws.close();
  }
  
  ws = new WebSocket(serverUrl);
  
  ws.on('open', () => {
    console.log('Connected to clipboard server, authenticating...');
    // Authenticate immediately
    ws.send(JSON.stringify({
      type: 'auth',
      code: roomCode
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'auth_success') {
        console.log(`✅ Connected to room "${roomCode}" - clipboard sharing active!`);
        isConnected = true;
        updateTrayIcon();
        updateTrayMenu();
      } else if (message.type === 'auth_failed') {
        console.log('Authentication failed');
        dialog.showErrorBox('Authentication Failed', 'Wrong room code. Please check your room code and try again.');
        isConnected = false;
        updateTrayIcon();
        updateTrayMenu();
      } else if (message.type === 'clipboard') {
        const content = message.content;
        
        if (content.type === 'text') {
          const preview = content.data.length > 50 ? `"${content.data.substring(0, 50)}..."` : `"${content.data}"`;
          console.log(`📥 Received text from others: ${preview}`);
          clipboard.writeText(content.data);
        } else if (content.type === 'image') {
          console.log(`📥 Received image from others: ${content.width}x${content.height}`);
          const imageBuffer = Buffer.from(content.data, 'base64');
          const image = nativeImage.createFromBuffer(imageBuffer);
          clipboard.writeImage(image);
        } else {
          console.log(`📥 Received ${content.type} from others (not supported)`);
        }
        
        // Update our hash to prevent echo
        const formats = clipboard.availableFormats();
        lastClipboardHash = JSON.stringify(formats.sort());
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from server - clipboard sharing paused');
    console.log('⏳ Will retry connection in 5 seconds...');
    isConnected = false;
    updateTrayIcon();
    updateTrayMenu();
    // Reconnect after 5 seconds
    setTimeout(createConnection, 5000);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    isConnected = false;
    updateTrayIcon();
    updateTrayMenu();
  });
}

function watchClipboard() {
  console.log('👀 Starting clipboard monitoring...');
  
  setInterval(() => {
    try {
      // Simple text monitoring first
      const currentText = clipboard.readText();
      if (currentText !== lastClipboard && currentText.length > 0) {
        lastClipboard = currentText;
        
        const preview = currentText.length > 50 ? `"${currentText.substring(0, 50)}..."` : `"${currentText}"`;
        console.log(`📋 Text clipboard changed: ${preview}`);
        
        if (ws && ws.readyState === WebSocket.OPEN && isConnected) {
          console.log(`📤 Sharing text with ${roomCode} room...`);
          ws.send(JSON.stringify({
            type: 'clipboard',
            content: {
              type: 'text',
              data: currentText
            },
            timestamp: Date.now()
          }));
        } else {
          console.log(`❌ Not connected - text not shared`);
        }
        return; // Exit early if we found text
      }
      
      // Check for images only if no text change
      if (clipboard.has('image')) {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
          // Create a simple hash to detect image changes
          const size = image.getSize();
          const imageHash = `${size.width}x${size.height}`;
          
          if (imageHash !== lastClipboardHash) {
            lastClipboardHash = imageHash;
            
            console.log(`📋 Image clipboard changed: ${imageHash}`);
            
            if (ws && ws.readyState === WebSocket.OPEN && isConnected) {
              console.log(`📤 Sharing image with ${roomCode} room...`);
              ws.send(JSON.stringify({
                type: 'clipboard',
                content: {
                  type: 'image',
                  data: image.toPNG().toString('base64'),
                  width: size.width,
                  height: size.height
                },
                timestamp: Date.now()
              }));
            } else {
              console.log(`❌ Not connected - image not shared`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Clipboard monitoring error:', error);
    }
  }, 1000);
}

function updateTrayIcon() {
  if (tray) {
    tray.setImage(createTrayIcon(isConnected));
  }
}

function updateTrayMenu() {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Clippy - Clipboard Share',
      enabled: false
    },
    {
      label: `Status: ${isConnected ? 'Connected' : 'Disconnected'}`,
      enabled: false
    },
    {
      label: `Room: ${roomCode}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Settings...',
      click: showSettings
    },
    {
      label: isConnected ? 'Disconnect' : 'Connect',
      click: isConnected ? disconnect : createConnection
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function showSettings() {
  // Simple input dialogs for settings
  dialog.showMessageBox({
    type: 'info',
    title: 'Settings',
    message: 'Settings',
    detail: `Current Server: ${serverUrl}\nCurrent Room Code: ${roomCode}\n\nTo change settings, quit the app and restart with environment variables:\nCLIPPY_SERVER_URL=ws://your-server:3001\nCLIPPY_ROOM_CODE=your-room-code`,
    buttons: ['OK']
  });
}

function disconnect() {
  if (ws) {
    ws.close();
  }
  isConnected = false;
  updateTrayIcon();
  updateTrayMenu();
}

app.dock?.hide(); // Hide from dock on macOS

app.whenReady().then(() => {
  // Get settings from environment variables
  roomCode = process.env.CLIPPY_ROOM_CODE || roomCode;
  serverUrl = process.env.CLIPPY_SERVER_URL || serverUrl;
  
  console.log('🔗 Starting Clippy - Clipboard Share');
  console.log(`📡 Server: ${serverUrl}`);
  console.log(`🔐 Room: ${roomCode}`);
  console.log('👀 Monitoring clipboard for changes...');
  console.log('💡 Copy something to test!');
  console.log('');
  
  // Create system tray
  tray = new Tray(createTrayIcon(false));
  tray.setToolTip('Clippy - Clipboard Share');
  
  updateTrayMenu();
  
  // Start clipboard monitoring and connection
  createConnection();
  watchClipboard();
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Keep running in background
});

app.on('before-quit', () => {
  if (ws) {
    ws.close();
  }
});
