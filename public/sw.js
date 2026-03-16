/*
  PWA Placeholder
  - MVP: 暂不启用复杂缓存策略
  - Future: 使用 Workbox 或 next-pwa 接入离线缓存与更新策略
*/
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
