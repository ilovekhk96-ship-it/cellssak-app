import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sortedPrayerGuides } from '../../data/prayerGuides';

// "어떻게 기도할까요?" — 기도 가이드 목차 → 상세. 지금은 PRAYER_GUIDES가 비어있을 수 있는데,
// 그때도 에러 없이 자연스러운 빈 상태를 보여준다. 실제 가이드 콘텐츠는 이 화면 코드를 건드릴
// 필요 없이 data/prayerGuides.js 배열에 항목만 추가하면 됨.
export default function PrayerGuidePanel() {
  const guides = sortedPrayerGuides();
  const [selectedId, setSelectedId] = useState(null);

  if (guides.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-8 py-10 text-center">
        <p style={{ color: 'var(--ink-soft)' }} className="text-sm leading-relaxed">
          아직 준비된 기도 가이드가 없어요.
          <br />곧 채워질 예정이에요.
        </p>
      </div>
    );
  }

  const selected = guides.find((g) => g.id === selectedId) || null;

  if (selected) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <button
          onClick={() => setSelectedId(null)}
          style={{ color: 'var(--ink-soft)' }}
          className="flex items-center gap-1 text-xs mb-3"
        >
          <ChevronLeft size={14} /> 목차
        </button>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }} className="mb-1">
          {selected.title}
        </p>
        {selected.description && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }} className="mb-4">
            {selected.description}
          </p>
        )}
        <p style={{ color: 'var(--ink)', fontSize: '0.9rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {selected.body}
        </p>
        {selected.source && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }} className="mt-5">
            — {selected.source}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 flex flex-col gap-2.5">
      {guides.map((g) => (
        <button
          key={g.id}
          onClick={() => setSelectedId(g.id)}
          style={{ background: 'var(--paper)', borderRadius: '16px' }}
          className="px-4 py-3.5 text-left flex items-center justify-between gap-3 shadow-sm"
        >
          <span className="min-w-0">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }} className="block truncate">
              {g.title}
            </span>
            {g.description && (
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }} className="block truncate mt-0.5">
                {g.description}
              </span>
            )}
          </span>
          <ChevronRight size={16} style={{ color: 'var(--ink-soft)' }} className="shrink-0" />
        </button>
      ))}
    </div>
  );
}
