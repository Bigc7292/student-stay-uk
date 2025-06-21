// Service Worker for PWA functionality
const CACHE_NAME = 'studenthome-v1.1.0';
const STATIC_CACHE_NAME = 'studenthome-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'studenthome-dynamic-v1.1.0';
const IMAGE_CACHE_NAME = 'studenthome-images-v1.1.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\..*$/,
  /^https:\/\/maps\.googleapis\.com\/.*$/,
  /^https:\/\/data\.police\.uk\/.*$/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other unsupported schemes
  if (request.url.startsWith('chrome-extension:') ||
      request.url.startsWith('moz-extension:') ||
      request.url.startsWith('safari-extension:')) {
    return;
  }

  // Skip problematic external domains that cause CORS issues
  const problematicDomains = [
    'api.gov.uk',
    'googletagmanager.com',
    'google-analytics.com',
    'hotjar.com',
    'facebook.com',
    'twitter.com'
  ];

  if (problematicDomains.some(domain => url.hostname.includes(domain))) {
    // Let these requests go through without service worker intervention
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'document') {
    // HTML documents - Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image') {
    // Images - Cache first, fallback to network
    event.respondWith(cacheFirstStrategy(request));
  } else if (isAPIRequest(url)) {
    // API requests - Network first with cache fallback
    event.respondWith(networkFirstWithCacheStrategy(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // JS/CSS - Stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Everything else - Network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Caching strategies
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch:', request.url, error);
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request) {
  // Skip chrome-extension and other unsupported schemes
  if (request.url.startsWith('chrome-extension:') ||
      request.url.startsWith('moz-extension:') ||
      request.url.startsWith('safari-extension:')) {
    return fetch(request);
  }

  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok && !request.url.startsWith('chrome-extension:')) {
      try {
        cache.put(request, networkResponse.clone());
      } catch (error) {
        console.warn('Cache put failed:', error);
      }
    }
    return networkResponse;
  }).catch((error) => {
    // Only log significant errors, not routine network failures
    if (!error.message.includes('Failed to fetch')) {
      console.log('Background fetch failed:', error);
    }
    return cachedResponse || new Response('Offline', { status: 503 });
  });

  return cachedResponse || fetchPromise;
}

async function networkFirstWithCacheStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      // Cache API responses for 5 minutes
      const responseToCache = networkResponse.clone();
      // Create new response with cache timestamp
      const newHeaders = new Headers(responseToCache.headers);
      newHeaders.set('sw-cache-timestamp', Date.now().toString());
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: newHeaders
      });
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('API request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh (5 minutes)
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (cacheTimestamp && (now - parseInt(cacheTimestamp)) < fiveMinutes) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Helper functions
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-search') {
    event.waitUntil(syncSearchData());
  } else if (event.tag === 'background-sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

async function syncSearchData() {
  try {
    // Sync any pending search data when back online
    const pendingSearches = await getStoredData('pending-searches');
    
    if (pendingSearches && pendingSearches.length > 0) {
      for (const search of pendingSearches) {
        try {
          await fetch('/api/search', {
            method: 'POST',
            body: JSON.stringify(search),
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.log('Failed to sync search:', error);
        }
      }
      
      // Clear pending searches
      await clearStoredData('pending-searches');
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

async function syncUserData() {
  try {
    // Sync any pending user data when back online
    const pendingUserData = await getStoredData('pending-user-data');
    
    if (pendingUserData) {
      try {
        await fetch('/api/user/sync', {
          method: 'POST',
          body: JSON.stringify(pendingUserData),
          headers: { 'Content-Type': 'application/json' }
        });
        
        await clearStoredData('pending-user-data');
      } catch (error) {
        console.log('Failed to sync user data:', error);
      }
    }
  } catch (error) {
    console.log('User data sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getStoredData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StudentHomeDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => resolve(getRequest.result?.data);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
  });
}

async function clearStoredData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StudentHomeDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const deleteRequest = store.delete(key);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification handling with VAPID support
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'StudentHome',
    body: 'New accommodation matches found!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'default'
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        image: data.image,
        data: data.data || {},
        actions: data.actions || []
      };
    } catch (error) {
      // Fallback to text content
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    vibrate: [200, 100, 200],
    data: {
      ...notificationData.data,
      dateOfArrival: Date.now(),
      url: notificationData.data?.url || '/'
    },
    actions: notificationData.actions.length > 0 ? notificationData.actions : [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ],
    tag: notificationData.tag,
    requireInteraction: notificationData.data?.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  let targetUrl = '/';

  // Handle specific actions
  switch (action) {
    case 'view':
    case 'explore':
      targetUrl = notificationData.url || '/search';
      break;
    case 'save':
      targetUrl = '/saved-properties';
      break;
    case 'close':
      // Just close the notification
      return;
    default:
      // Default action based on notification type
      if (notificationData.type) {
        switch (notificationData.type) {
          case 'new-property':
            targetUrl = '/search';
            break;
          case 'price-alert':
            targetUrl = '/saved-properties';
            break;
          case 'application-update':
            targetUrl = '/applications';
            break;
          case 'maintenance-reminder':
            targetUrl = '/maintenance';
            break;
          default:
            targetUrl = '/';
        }
      }
  }

  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

console.log('Service Worker loaded successfully');
