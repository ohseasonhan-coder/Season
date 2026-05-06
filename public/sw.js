// Season CFO Service Worker
// 전략: 앱 셸(HTML/CSS/JS) → Cache First / API 요청 → Network First

const CACHE_NAME = "season-cfo-v1";
const OFFLINE_PAGE = "/";

// 설치 시 앱 셸 사전 캐시
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] 사전 캐시 일부 실패:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청: Network First (실패 시 캐시 없음 → 오프라인 JSON 응답)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() =>
          new Response(
            JSON.stringify({ ok: false, error: "오프라인 상태입니다. 네트워크를 확인해주세요." }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          )
        )
    );
    return;
  }

  // Supabase 요청: 항상 네트워크
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(fetch(request));
    return;
  }

  // 외부 시세 API: 항상 네트워크
  if (
    url.hostname.includes("finance.yahoo.com") ||
    url.hostname.includes("finance.naver.com") ||
    url.hostname.includes("open.er-api.com")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // 앱 셸 / 정적 자산: Cache First → Network Fallback
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          // JS/CSS/이미지는 캐시에 저장
          const isAsset =
            url.pathname.match(/\.(js|css|svg|png|ico|woff2?)$/) ||
            url.pathname === "/" ||
            url.pathname.endsWith(".html");

          if (isAsset) {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          }
          return response;
        })
        .catch(() => {
          // 오프라인 + HTML 요청 → 앱 셸 반환 (SPA 지원)
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match(OFFLINE_PAGE);
          }
        });
    })
  );
});
