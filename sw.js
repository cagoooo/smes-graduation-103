/* =========================================================
   石門國小 第103屆畢業典禮 ・ Service Worker
   每次部署請同步調整 BUILD_VERSION（也同步 version.json 與
   index.html 內 styles.css?v= / script.js?v=），sw.js 內容變動
   瀏覽器才會偵測到更新並觸發版本提示。
   ========================================================= */
const BUILD_VERSION = "1.16.12";
const CACHE = "smes-grad-" + BUILD_VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css?v=1.16.12",
  "./script.js?v=1.16.12",
  "./assets/logo.png",
  "./favicon.ico",
  "./manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  // 不自動 skipWaiting：讓頁面顯示「立即更新」提示，由使用者決定何時接管
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.allSettled(
        PRECACHE.map(function (u) { return c.add(u).catch(function () {}); })
      );
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
      .then(function () {
        return self.clients.matchAll({ type: "window" }).then(function (cs) {
          cs.forEach(function (c) {
            c.postMessage({ type: "SW_ACTIVATED", version: BUILD_VERSION });
          });
        });
      })
  );
});

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  // 只處理同源資源；Google Fonts / YouTube 等跨域交給瀏覽器
  if (url.origin !== self.location.origin) return;

  // version.json：永遠 network-first，拿不到才回退快取
  if (url.pathname.indexOf("version.json") !== -1) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  // HTML / 導覽：network-first（確保總是最新頁面）
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  // 其他靜態資源（CSS/JS/圖片）：cache-first，再 network 補快取
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
