// Lưu sẵn app vào máy để mở được khi mất mạng.
// Mỗi lần sửa app, tăng số phiên bản này (và APP_VERSION trong index.html).
var CACHE = 'taphoa-v20';
var FILES = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // cache: 'reload' = luôn tải bản mới từ GitHub, không lấy bản cũ trong bộ nhớ đệm
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Có mạng: luôn hỏi GitHub bản mới nhất rồi cập nhật bộ nhớ. Mất mạng: dùng bản đã lưu.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
        return hit || (e.request.mode === 'navigate' ? caches.match('./') : undefined);
      });
    })
  );
});
