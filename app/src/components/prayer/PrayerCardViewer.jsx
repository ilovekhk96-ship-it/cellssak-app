import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 나의 기도 / 중보기도 공통으로 쓰는 "한 장씩 넘기기" 카드 뷰어 — 순수 표시용(수정/삭제 없음).
// items: [{ key, title, subtitle, body, badge }]
export default function PrayerCardViewer({ items, emptyText }) {
  const [index, setIndex] = useState(0);

  // 리스트 자체가 바뀌면(다른 카드가 사라지는 등) 범위를 벗어나지 않게 보정
  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-8 py-10 text-center">
        <p style={{ color: 'var(--ink-soft)' }} className="text-sm leading-relaxed">
          {emptyText}
        </p>
      </div>
    );
  }

  const item = items[index];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 pb-6 pt-2 gap-4">
      <div
        key={item.key}
        style={{ background: 'var(--paper)', borderRadius: '20px', minHeight: '180px' }}
        className="w-full max-w-xs px-5 py-6 flex flex-col gap-3 shadow-sm"
      >
        {item.badge && (
          <span
            style={{ background: item.badge.soft, color: item.badge.color, width: 'fit-content' }}
            className="text-xs px-2.5 py-1 rounded-full"
          >
            {item.badge.label}
          </span>
        )}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>{item.title}</p>
        {item.subtitle && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{item.subtitle}</p>
        )}
        {item.body && (
          <p style={{ color: 'var(--ink)', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {item.body}
          </p>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex items-center gap-5">
          <button
            aria-label="이전"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            style={{ color: 'var(--ink)' }}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>
            {index + 1} / {items.length}
          </span>
          <button
            aria-label="다음"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            style={{ color: 'var(--ink)' }}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
