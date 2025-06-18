/**
 * ChefMate Service Worker
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'chefmate-v1';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/search.html',
    '/recipe.html',
    '/favorites.html',
    '/profile.html',
    '/assets/css/styles.css',
    '/assets/js/main.js',
    '/assets/js/utils.js',
    '/assets/js/api.js',
    '/assets/js/app.js',
    '/assets/js/search.js',
    '/assets/js/recipe.js',
    '/assets/js/favorites.js',
    '/assets/js/profile.js',
    '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
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
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests (let them fail gracefully)
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Skip chrome-extension and other unsupported schemes
    if (event.request.url.startsWith('chrome-extension://') ||
        event.request.url.startsWith('moz-extension://') ||
        event.request.url.startsWith('safari-extension://')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch((error) => {
                                // Silently ignore cache errors for unsupported schemes
                                console.debug('Cache put failed:', error.message);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle any offline actions that need to be synced
    console.log('Background sync triggered');
    
    // Example: sync favorite recipes, shopping lists, etc.
    try {
        // Get pending actions from IndexedDB or localStorage
        // Sync with server when online
        console.log('Syncing offline data...');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications (for timer alerts, etc.)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'ChefMate notification',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open ChefMate',
                icon: '/favicon.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/favicon.svg'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('ChefMate', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
