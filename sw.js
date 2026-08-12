// Juan的工作台 · 离线缓存与秒开
// 策略（v6）：stale-while-revalidate —— 导航与静态资源均【先返回本地缓存（秒开）】，
// 同时在后台拉取最新版并更新缓存；下次打开即为最新。无网络时直接用缓存（离线可用）。
const CACHE = 'juan-desk-v6';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 先返回缓存（秒开），后台静默更新
function swr(req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      var fetched = fetch(req).then(function (res) {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fetched;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(swr(req));
});
