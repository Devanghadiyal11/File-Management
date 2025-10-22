// Service Worker for Secure File Manager
// Provides caching, background sync, and offline functionality

const CACHE_NAME = 'sfm-cache-v1';
const DYNAMIC_CACHE_NAME = 'sfm-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/css/main.css',
  '/static/js/main.js'
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  '/api/files',
  '/api/folders',
  '/api/auth/profile',
  '/uploads/'
];

// Maximum cache size (in items)
const MAX_CACHE_SIZE = 100;
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests and non-GET requests for caching
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  // Apply different caching strategies based on request type
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleDynamicContent(request));
  }
});

// Handle static assets - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static asset request failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests - Network First strategy with background update
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);

    if (networkResponse.status === 200) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Clean up cache if it gets too large
      cleanupCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.warn('Network request failed, trying cache:', error);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }

    // Return error response if no cache available
    return new Response(
      JSON.stringify({ 
        error: 'Request failed and no cached version available',
        offline: true 
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle image requests - Cache First with background update
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Update in background
      fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const cache = caches.open(DYNAMIC_CACHE_NAME);
          cache.then(c => c.put(request, networkResponse));
        }
      }).catch(() => {}); // Ignore background update failures
      
      return cachedResponse;
    }

    // If not in cache, try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      cleanupCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.error('Image request failed:', error);
    return new Response('Image not available offline', { status: 503 });
  }
}

// Handle dynamic content - Network First
async function handleDynamicContent(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      cleanupCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', { status: 503 });
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = request.url;
  return url.includes('/static/') || 
         url.endsWith('.js') || 
         url.endsWith('.css') || 
         url.endsWith('.ico') ||
         url.endsWith('/manifest.json');
}

function isApiRequest(request) {
  return request.url.includes('/api/') && 
         CACHEABLE_API_PATTERNS.some(pattern => request.url.includes(pattern));
}

function isImageRequest(request) {
  const url = request.url;
  return url.includes('/uploads/') ||
         request.headers.get('accept')?.includes('image/') ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

// Clean up cache to prevent unlimited growth
async function cleanupCache(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxSize) {
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      console.log(`🧹 Cleaned up ${keysToDelete.length} items from ${cacheName}`);
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'upload-files') {
    event.waitUntil(processOfflineUploads());
  } else if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Process uploads that were queued while offline
async function processOfflineUploads() {
  try {
    const pendingUploads = await getStoredData('pendingUploads') || [];
    
    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('files', upload.file);
        formData.append('folderId', upload.folderId);
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${upload.token}` },
          body: formData
        });
        
        if (response.ok) {
          console.log('✅ Offline upload completed:', upload.fileName);
          // Remove from pending uploads
          await removeFromStoredArray('pendingUploads', upload);
          
          // Notify client
          broadcastMessage({
            type: 'upload-complete',
            fileName: upload.fileName,
            offline: true
          });
        }
      } catch (error) {
        console.error('Failed to process offline upload:', error);
      }
    }
  } catch (error) {
    console.error('Error processing offline uploads:', error);
  }
}

// Sync favorites that were modified offline
async function syncFavorites() {
  try {
    const pendingFavorites = await getStoredData('pendingFavorites') || [];
    
    for (const favorite of pendingFavorites) {
      try {
        const response = await fetch('/api/favorites', {
          method: favorite.action === 'add' ? 'POST' : 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${favorite.token}` 
          },
          body: JSON.stringify({ fileId: favorite.fileId })
        });
        
        if (response.ok) {
          console.log('✅ Favorite sync completed:', favorite.fileName);
          await removeFromStoredArray('pendingFavorites', favorite);
        }
      } catch (error) {
        console.error('Failed to sync favorite:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing favorites:', error);
  }
}

// Handle push notifications (for future file sharing features)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'default',
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Secure File Manager', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'queue-upload':
      queueOfflineUpload(data);
      break;
    case 'queue-favorite':
      queueOfflineFavorite(data);
      break;
    case 'clear-cache':
      clearAllCaches();
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Queue operations for when back online
async function queueOfflineUpload(uploadData) {
  try {
    const pendingUploads = await getStoredData('pendingUploads') || [];
    pendingUploads.push({
      ...uploadData,
      timestamp: Date.now()
    });
    await storeData('pendingUploads', pendingUploads);
    
    // Register for background sync
    self.registration.sync.register('upload-files');
  } catch (error) {
    console.error('Failed to queue upload:', error);
  }
}

async function queueOfflineFavorite(favoriteData) {
  try {
    const pendingFavorites = await getStoredData('pendingFavorites') || [];
    pendingFavorites.push({
      ...favoriteData,
      timestamp: Date.now()
    });
    await storeData('pendingFavorites', pendingFavorites);
    
    // Register for background sync
    self.registration.sync.register('sync-favorites');
  } catch (error) {
    console.error('Failed to queue favorite:', error);
  }
}

// Utility functions for IndexedDB storage
async function storeData(key, data) {
  const cache = await caches.open('sfm-data-storage');
  const response = new Response(JSON.stringify(data));
  await cache.put(key, response);
}

async function getStoredData(key) {
  const cache = await caches.open('sfm-data-storage');
  const response = await cache.match(key);
  return response ? response.json() : null;
}

async function removeFromStoredArray(key, item) {
  const data = await getStoredData(key) || [];
  const filtered = data.filter(d => d.timestamp !== item.timestamp);
  await storeData(key, filtered);
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('🧹 All caches cleared');
}

function broadcastMessage(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(message));
  });
}

console.log('🚀 Service Worker: Loaded and ready for multicore file management!');