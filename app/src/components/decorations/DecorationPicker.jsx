import { useState } from 'react';
import { X } from 'lucide-react';
import { DECORATIONS, DECORATION_CATEGORIES } from '../../data/decorations';

// 나무 장식 고르기 — 팝업 카드(다른 화면들과 같은 스타일). 한 슬롯엔 하나만 달리므로
// 같은 자리를 쓰는 다른 장식을 누르면 자동으로 교체되고, 이미 장착한 걸 다시 누르면 벗겨짐.
export default function DecorationPicker({ equippedIds, onToggle, onClose }) {
  const [category, setCategory] = useState(DECORATION_CATEGORIES[0]);
  const equippedSet = new Set(equippedIds);
  const visible = DECORATIONS.filter((d) => d.category === category);

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--paper': '#FFFDF9',
    '--font-display': "'Gowun Batang', serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  return (
    <div style={{ ...vars, maxWidth: '384px', margin: '0 auto' }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={onClose} />
      <div
        style={{ background: 'var(--paper)', fontFamily: 'var(--font-body)', color: 'var(--ink)', height: '78vh', maxHeight: '600px' }}
        className="relative w-full rounded-3xl shadow-xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>나무 장식</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ background: '#F5F0E8', color: 'var(--ink)' }}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3 shrink-0 overflow-x-auto">
          {DECORATION_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                background: category === c ? '#5C7A55' : '#F5F0E8',
                color: category === c ? '#FFF8F0' : 'var(--ink-soft)',
              }}
              className="px-3.5 py-1.5 rounded-full text-xs shrink-0"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {visible.map((d) => {
              const isOn = equippedSet.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => onToggle(d)}
                  style={{
                    background: isOn ? '#E8F3E4' : '#F5F0E8',
                    borderRadius: '16px',
                    outline: isOn ? '2px solid #5C7A55' : 'none',
                  }}
                  className="px-2 py-4 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span style={{ fontSize: '1.8rem' }}>{d.emoji}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{d.name}</span>
                </button>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }} className="text-center mt-8">
              이 카테고리엔 아직 장식이 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
