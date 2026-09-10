import { useState } from 'react';
import { PRAYER_VERSES } from '../data/constants';

export default function ThoughtBubble() {
  const [verse] = useState(() => PRAYER_VERSES[Math.floor(Math.random() * PRAYER_VERSES.length)]);
  return (
    <div className="thought-bubble flex flex-col items-center pt-4 px-6" style={{ position: 'relative', zIndex: 1 }}>
      {/* 말씀 길이가 매번 랜덤이라 짧은 말씀이 나오면 말풍선이 낮아지면서 그 아래 나무
          위치까지 화면마다 미묘하게 달라 보이던 문제가 있었음 — 최대 3줄 기준으로
          높이를 고정해서(minHeight) 나무 위치가 항상 일정하게 유지되도록 함 */}
      <div
        style={{ background: '#FFFDF9', maxWidth: '260px', minHeight: '108px' }}
        className="rounded-3xl px-4 py-3 shadow-sm text-center flex flex-col justify-center"
      >
        <p style={{ color: 'var(--ink)' }} className="text-xs leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p style={{ color: '#7C9EC9' }} className="text-xs mt-1 font-medium">
          {verse.ref}
        </p>
      </div>
      <div style={{ background: '#FFFDF9', width: '13px', height: '13px', borderRadius: '50%', marginTop: '5px' }} />
      <div style={{ background: '#FFFDF9', width: '7px', height: '7px', borderRadius: '50%', marginTop: '4px' }} />
    </div>
  );
}
