const CACHE_NAME = 'hobbyhockey-v1'

// Only cache the app shell (fonts, static assets)
// Never cache API calls or user data
const PRECACHE_URLS = [
  '/',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache Supabase API calls — always go to network
  if (url.hostname.includes('supabase')) return

  // Never cache POST/PUT/DELETE
  if (event.request.method !== 'GET') return

  // For navigation requests, always go to network first (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    )
    return
  }

  // For static assets, cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
