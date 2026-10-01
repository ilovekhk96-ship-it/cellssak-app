// 개발용 — 로그인/Firebase 없이 "함께 기도" 패널의 화면만 확인한다.
// 데이터 계층(groupPrayer.js)을 가짜로 바꿔치기해서 Firestore 없이도 목록·폼이 그려지는지 본다.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// 실제 패널은 Firestore를 구독하므로, 미리보기에서는 같은 모양의 가짜 데이터를 넣은
// 복제본을 쓰는 대신 모듈을 가로채기 어렵다 — 대신 패널이 쓰는 함수만 흉내 낸 wrapper를 둔다.
import GroupPrayerPanel from './components/prayer/GroupPrayerPanel.jsx';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

function Preview() {
  const [isLeader, setIsLeader] = useState(true);
  return (
    <div className="w-full min-h-screen p-4" style={{ background: PAGE_BG }}>
      <div className="max-w-sm mx-auto flex flex-col gap-3">
        <button
          onClick={() => setIsLeader((v) => !v)}
          className="self-start text-xs rounded-lg px-2 py-1"
          style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        >
          지금: {isLeader ? '셀장' : '셀원'} (눌러서 전환)
        </button>
        {/* 셀 메뉴 탭 안에 들어갈 때와 같은 배경·여백 */}
        <div style={{ background: '#F5F0E8' }} className="rounded-2xl p-4">
          <GroupPrayerPanel churchId="preview" cellId="preview" myUid="preview-uid" isLeader={isLeader} />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview />
  </StrictMode>
);
