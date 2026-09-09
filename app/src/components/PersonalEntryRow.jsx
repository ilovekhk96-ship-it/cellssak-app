import { useState } from 'react';
import { Pencil, Sparkles, Flame } from 'lucide-react';
import { STATUS, todayStr } from '../data/constants';

export default function PersonalEntryRow({ entry, editMode, onPray, onConvert, onEditEntry }) {
  const [confirmingConvert, setConfirmingConvert] = useState(false);
  const prayedToday = entry.lastPrayedDate === todayStr();

  return (
    <div
      onClick={() => editMode && onEditEntry(entry)}
      style={{ background: '#FFFFFF', border: '1px solid var(--line)' }}
      className={`rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2 ${editMode ? 'cursor-pointer' : ''}`}
    >
      <p style={{ color: 'var(--ink)' }} className="text-sm whitespace-pre-wrap break-words flex-1 min-w-0">
        {entry.content}
      </p>

      {editMode ? (
        <Pencil size={15} style={{ color: 'var(--ink-soft)' }} className="shrink-0" />
      ) : entry.status === 'seed' ? (
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingConvert(true);
            }}
            title="믿음 가지게 됨"
            style={{ color: STATUS.fruit.color }}
          >
            <Sparkles size={17} />
          </button>

          {confirmingConvert && (
            <div
              className="fixed inset-0 flex items-center justify-center z-30 px-6"
              style={{ maxWidth: '384px', margin: '0 auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setConfirmingConvert(false)} />
              <div
                style={{ background: '#FFFDF9', color: 'var(--ink)' }}
                className="relative rounded-3xl px-6 py-7 flex flex-col items-center gap-4 shadow-xl text-center max-w-xs"
              >
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>정말 믿음열매로 바꾸시겠어요?</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setConfirmingConvert(false)}
                    style={{ background: '#E8DADB', color: 'var(--ink)' }}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      onConvert(entry.id);
                      setConfirmingConvert(false);
                    }}
                    style={{ background: STATUS.fruit.color, color: '#FFF8F0' }}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium"
                  >
                    바꾸기
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onPray(entry.id);
            }}
            style={{ color: prayedToday ? STATUS.seed.color : 'var(--ink-soft)' }}
            className="flex flex-col items-center gap-0.5"
          >
            <Flame size={16} fill={prayedToday ? STATUS.seed.color : 'none'} />
            <span style={{ fontSize: '9px', lineHeight: '10px' }}>
              기도했어요{prayedToday ? '!' : ''} ({entry.prayerCount || 0})
            </span>
          </button>
        </div>
      ) : (
        <div style={{ color: 'var(--ink-soft)' }} className="flex flex-col items-center gap-0.5 shrink-0" title="기도한 횟수 (고정됨)">
          <Flame size={15} fill="var(--ink-soft)" />
          <span style={{ fontSize: '9px', lineHeight: '10px' }}>{entry.prayerCount || 0}회</span>
        </div>
      )}
    </div>
  );
}
