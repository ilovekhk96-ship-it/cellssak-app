// 개발용 — 로그인/Firebase 없이 "함께 기도" 화면들을 확인한다.
// 패널(약속 목록·만들기)과 세션(말씀 카드·넘김)을 따로 띄워볼 수 있다.
// Firestore 구독은 권한이 없어 실패하므로, 세션 쪽은 가짜 약속을 직접 넘겨서 본다.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import GroupPrayerPanel from './components/prayer/GroupPrayerPanel.jsx';
import GroupPrayerSession from './components/prayer/GroupPrayerSession.jsx';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

const FAKE_USER = { uid: 'preview-uid', displayName: '하경', photoURL: null };

const FAKE_GP = {
  id: 'preview-gp',
  title: '목요일 밤 함께 기도',
  mode: 'self',
  currentIndex: 0,
  passages: [
    {
      ref: '시편 23:1-3',
      text: '여호와는 나의 목자시니 내게 부족함이 없으리로다\n그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다\n내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다',
    },
    {
      ref: '시편 23:4',
      text: '내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라\n주의 지팡이와 막대기가 나를 안위하시나이다',
    },
    {
      ref: '시편 23:5-6',
      text: '주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다\n내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다',
    },
  ],
};

function Preview() {
  const [screen, setScreen] = useState('panel'); // 'panel' | 'session'
  const [isLeader, setIsLeader] = useState(true);
  const [mode, setMode] = useState('self');

  if (screen === 'session') {
    return (
      <>
        {/* key를 바꿔 다시 만들게 한다 — 실제 앱에서는 모드가 Firestore 구독으로 흘러들지만
            미리보기에는 구독이 없어서, 모드를 바꾸면 세션을 새로 띄워야 반영된다 */}
        <GroupPrayerSession
          key={`${mode}-${isLeader}`}
          user={FAKE_USER}
          churchId="preview"
          cellId="preview"
          groupPrayer={{ ...FAKE_GP, mode }}
          isLeader={isLeader}
          onClose={() => setScreen('panel')}
        />
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[60] flex gap-1 text-xs">
          <button onClick={() => setMode(mode === 'self' ? 'leader' : 'self')} className="rounded-lg px-2 py-1 bg-white">
            {mode === 'self' ? '각자 속도' : '인도자 진행'}
          </button>
          <button onClick={() => setIsLeader((v) => !v)} className="rounded-lg px-2 py-1 bg-white">
            {isLeader ? '셀장' : '셀원'}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="w-full min-h-screen p-4" style={{ background: PAGE_BG }}>
      <div className="max-w-sm mx-auto flex flex-col gap-3">
        <div className="flex gap-1 text-xs">
          <button onClick={() => setIsLeader((v) => !v)} className="rounded-lg px-2 py-1 bg-white">
            지금: {isLeader ? '셀장' : '셀원'}
          </button>
          <button onClick={() => setScreen('session')} className="rounded-lg px-2 py-1 bg-white">
            함께 기도 화면 보기
          </button>
        </div>
        <div style={{ background: '#F5F0E8' }} className="rounded-2xl p-4">
          <GroupPrayerPanel churchId="preview" cellId="preview" user={FAKE_USER} isLeader={isLeader} />
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
