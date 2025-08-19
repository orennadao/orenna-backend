const CACHE_NAME = 'orenna-dao-v1';
const API_CACHE_NAME = 'orenna-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/analytics',
  '/payments',
  '/projects',
  '/mint-requests',
  '/indexer',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/') || url.origin.includes('localhost:3000')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE_NAME, 5 * 60 * 1000) // 5 minutes
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.woff2')
  ) {
    event.respondWith(
      cacheFirstStrategy(request, CACHE_NAME)
    );
    return;
  }

  // Handle navigation requests with stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      staleWhileRevalidateStrategy(request, CACHE_NAME)
    );
    return;
  }

  // Default to network
  event.respondWith(fetch(request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network-first strategy for API calls
async function networkFirstStrategy(request, cacheName, maxAge = 5 * 60 * 1000) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // Add timestamp for cache expiry
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < maxAge) {
        return cachedResponse;
      }
    }
    
    return new Response('Network error and no valid cache', { status: 503 });
  }
}

// Stale-while-revalidate strategy for navigation
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Return cached response if network fails
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push notifications handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: data.url
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});