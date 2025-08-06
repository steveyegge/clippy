#!/usr/bin/env node

const { clipboard } = require('electron');

console.log('📋 Simulating clipboard changes for demo...');
console.log('');

// Simulate clipboard changes
setTimeout(() => {
  console.log('Setting clipboard to: "Hello World"');
  clipboard.writeText('Hello World');
}, 2000);

setTimeout(() => {
  console.log('Setting clipboard to: "This is a longer message that will be truncated in the preview"');
  clipboard.writeText('This is a longer message that will be truncated in the preview');
}, 4000);

setTimeout(() => {
  console.log('Setting clipboard to: "Final test message"');
  clipboard.writeText('Final test message');
}, 6000);

setTimeout(() => {
  console.log('Demo complete!');
  process.exit(0);
}, 8000);
