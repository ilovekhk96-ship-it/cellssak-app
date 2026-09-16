import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRoot from './AppRoot.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);

// PWA 설치 가능하게(홈화면 추가/스토어 패키징의 전제조건) 최소한의 서비스워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 등록 실패해도 앱 자체 동작엔 지장 없으니 조용히 무시
    });
  });
}
