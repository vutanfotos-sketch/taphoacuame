// Lưu sẵn app vào máy để mở được khi mất mạng.
// Mỗi lần sửa index.html, tăng số phiên bản này để điện thoại tải bản mới.
var CACHE = 'taphoa-v1';
var FILES = ['./', 'index.html', 'manifest.json', 'icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Có mạng: lấy bản mới nhất rồi cập nhật bộ nhớ. Mất mạng: dùng bản đã lưu.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
