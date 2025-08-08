// Background script for Connect.IO extension
// Service worker compatible - no window references

import 'webextension-polyfill';

console.log('Connect.IO background script loaded');

// Service worker event listeners
self.addEventListener('install', (event) => {
  console.log('Connect.IO service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Connect.IO service worker activated');
});
