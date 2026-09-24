// 개발용 — 로그인/Firebase 없이 버전1(벡터) 나무만 띄워서 잎·열매 개수를 바꿔가며 확인한다.
// 본 앱 진입점(main.jsx)과 분리돼 있고 vite build에도 안 들어간다(index.html만 빌드됨).
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import TreeSceneV1 from './components/TreeSceneV1.jsx';

const LEAF_PRESETS = [0, 7, 30, 100, 300, 1000, 3000];
const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

function Preview() {
  const [score, setScore] = useState(300);
  const [fruitCount, setFruitCount] = useState(3);
  return (
    <div className="relative w-full min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      <TreeSceneV1
        score={score}
        daysCount={Math.round(score / 5)}
        todayActiveCount={4}
        seedCount={12}
        fruitCount={fruitCount}
        showActions={false}
        treeLabel="하경의 기도나무"
        goldenIndices={new Set()}
        equippedDecorations={[]}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-wrap gap-1 justify-center bg-white/90 rounded-xl p-2 text-xs z-50">
        {LEAF_PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className={`px-2 py-1 rounded-lg ${score === n ? 'bg-[#6FA66B] text-white' : 'bg-white'}`}
          >
            잎{n}
          </button>
        ))}
        <span className="flex items-center gap-1 bg-white rounded-lg px-2">
          <button onClick={() => setFruitCount((f) => Math.max(0, f - 1))}>-</button>
          열매{fruitCount}
          <button onClick={() => setFruitCount((f) => f + 1)}>+</button>
        </span>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview />
  </StrictMode>
);
