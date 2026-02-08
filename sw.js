const CACHE_NAME = 'forranova-hub-v1.2';

// 1. ASSETS TO CACHE
// All paths are relative to where sw.js is located
const ASSETS = [
    '/ForraNova/',
    '/ForraNova/index.html',
    '/ForraNova/style.css',
    '/ForraNova/app.js',
    '/ForraNova/manifest.json',
    // External assets from your static repo
    'https://fofem.github.io/static/images/icon.png',
    'https://fofem.github.io/static/images/splash.png',
    'https://fofem.github.io/static/images/certificate.png',
    
    // --- External Core Libraries (Must be cached for Offline Math/PDF) ---
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0/dist/chartjs-plugin-annotation.min.js',    
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
    
    // --- Fonts ---
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// 2. INSTALLATION: Caching Resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('ForraNova Hub: App Initialized');
            // Using addAll to lock in all math and UI assets
            return cache.addAll(ASSETS);
        })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// 3. ACTIVATION: Cleaning old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('ForraNova Shield: Purging Legacy Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 4. FETCH STRATEGY: Cache First, Fallback to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached version immediately if found
            if (response) return response;

            // Otherwise, attempt to fetch from network and cache for next time
            return fetch(event.request).then((networkResponse) => {
                // Check if the response is valid or is an opaque (cross-origin) response
                if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
                    return networkResponse;
                }
                
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return networkResponse;
            });
        }).catch(() => {
            // Return the root index.html if the user is offline and the requested page isn't cached
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
