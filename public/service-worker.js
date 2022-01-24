const FILES_TO_CACHE = [
    "/index.html",
    "index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/indexdb.js",
    "/manifest.json",
]
const APP_PREFIX = "budget_tracker"
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener("install", function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log("Files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    )
    self.skipWaiting();
})
self.addEventListener('activate', function (e) {
  e.waitUntil(
      caches.keys().then(function (keyList) {
          let cacheKeeplist = keyList.filter(function (key) {
              return key.indexOf(APP_PREFIX);
          });
          cacheKeeplist.push(CACHE_NAME);

          return Promise.all(keyList.map(function (key, i) {
              if (cacheKeeplist.indexOf(key) === -1) {
                  console.log('deleting cache : ' + keyList[i] );
                  return caches.delete(keyList[i]);
              }
          }));
      })
  )
});

self.addEventListener('fetch', function (e) {
  console.log('fetch request : ' + e.request.url);
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(e.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(e.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(e.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }
  e.respondWith(
      caches.match(e.request).then(function (request) {
          if (request) { 
              console.log('responding with cache : ' + e.request.url);
              return request
          } else {       // if there is no cache
              console.log('file is not cached, fetching : ' + e.request.url);
              return fetch(e.request)
          }

      })
  )
});