
import React from 'react';
import { createRoot } from 'react-dom/client';
import SecureFileManager from './SecureFileManager';
import { ToastProvider } from './ToastContext';

// CoreUI & Bootstrap CSS
import '@coreui/coreui/dist/css/coreui.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// App styles (optional custom additions)
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

// Register service worker for multicore processing and caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 New Service Worker version available');
                // Optionally show update notification to user
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, fileName, offline } = event.data;
    
    if (type === 'upload-complete' && offline) {
      console.log(`✅ Offline upload completed: ${fileName}`);
      // Optionally show notification to user
    }
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <SecureFileManager />
    </ToastProvider>
  </React.StrictMode>
);
