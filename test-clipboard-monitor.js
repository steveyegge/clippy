#!/usr/bin/env node

// Simple test to see if clipboard monitoring works
const { app, clipboard } = require('electron');

let lastClipboard = '';
let lastClipboardHash = '';

function watchClipboard() {
  console.log('👀 Starting clipboard monitoring...');
  console.log('📋 Copy some text or image to test!');
  console.log('');
  
  setInterval(() => {
    // Check what formats are available in clipboard
    const formats = clipboard.availableFormats();
    
    // Create a hash of current clipboard state to detect any changes
    const currentHash = JSON.stringify(formats.sort());
    
    if (currentHash !== lastClipboardHash) {
      lastClipboardHash = currentHash;
      
      console.log(`🔍 Clipboard formats detected: ${formats.join(', ')}`);
      
      // Determine what type of content we have
      let contentType = '';
      let preview = '';
      
      if (clipboard.has('image')) {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
          contentType = 'image';
          const size = image.getSize();
          preview = `Image (${size.width}x${size.height})`;
        }
      } else if (clipboard.has('text/plain')) {
        const text = clipboard.readText();
        if (text && text.length > 0) {
          contentType = 'text';
          preview = text.length > 50 ? `"${text.substring(0, 50)}..."` : `"${text}"`;
        }
      } else if (formats.length > 0) {
        contentType = 'other';
        preview = `Unknown format: ${formats.join(', ')}`;
      }
      
      if (contentType) {
        console.log(`📋 Clipboard changed: ${preview}`);
        console.log(`📦 Content type: ${contentType}`);
        console.log('');
      }
    }
  }, 1000);
}

app.whenReady().then(() => {
  console.log('🔗 Clipboard Monitor Test');
  console.log('========================');
  console.log('');
  
  watchClipboard();
});

app.on('window-all-closed', (e) => {
  // Keep running to test clipboard
  e.preventDefault();
});

// Auto-exit after 30 seconds
setTimeout(() => {
  console.log('⏰ Test completed!');
  app.quit();
}, 30000);
