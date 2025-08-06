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
  setInterval(() => {
    // Check what formats are available in clipboard
    const formats = clipboard.availableFormats();
    
    // Create a hash of current clipboard state to detect any changes
    const currentHash = JSON.stringify(formats.sort());
    
    if (currentHash !== lastClipboardHash) {
      lastClipboardHash = currentHash;
      
      // Determine what type of content we have
      let clipboardData = null;
      let contentType = '';
      let preview = '';
      
      if (clipboard.has('image')) {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
          contentType = 'image';
          const size = image.getSize();
          clipboardData = {
            type: 'image',
            data: image.toPNG().toString('base64'),
            width: size.width,
            height: size.height
          };
          preview = `Image (${size.width}x${size.height})`;
        }
      } else if (clipboard.has('text/plain')) {
        const text = clipboard.readText();
        if (text && text.length > 0) {
          contentType = 'text';
          clipboardData = {
            type: 'text',
            data: text
          };
          preview = text.length > 50 ? `"${text.substring(0, 50)}..."` : `"${text}"`;
        }
      } else if (formats.length > 0) {
        contentType = 'other';
        preview = `Unknown format: ${formats.join(', ')}`;
      }
      
      if (clipboardData) {
        console.log(`📋 Clipboard changed: ${preview}`);
        
        if (ws && ws.readyState === WebSocket.OPEN && isConnected) {
          console.log(`📤 Sharing ${contentType} with ${roomCode} room...`);
          ws.send(JSON.stringify({
            type: 'clipboard',
            content: clipboardData,
            timestamp: Date.now()
          }));
        } else {
          console.log(`❌ Not connected - ${contentType} not shared`);
        }
      }
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
