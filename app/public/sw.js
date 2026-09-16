// 아주 최소한의 서비스워커 — PWA 설치 조건(서비스워커 존재)만 만족시키는 용도.
// Firestore 실시간 연결/인증 요청을 잘못 가로채면 앱이 깨질 수 있어서, 지금은 캐싱/오프라인
// 로직 없이 모든 요청을 그대로 네트워크로 흘려보내기만 한다.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // 의도적으로 비워둠 — respondWith를 호출하지 않으면 브라우저 기본 네트워크 동작을 그대로 씀
});
