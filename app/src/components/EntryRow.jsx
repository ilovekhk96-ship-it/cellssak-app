import { useState } from 'react';
import { Sparkles, Flame, Heart, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react';
import { STATUS, todayStr } from '../data/constants';

export default function EntryRow({ entry, meta, canEdit, canShare, onPray, onConvert, onLike, onEditEntry, onDeleteEntry, onShare, shareLabel }) {
  const prayedToday = entry.lastPrayedDate === todayStr();
  const likeCount = entry.likeCount || 0;
  const [confirmingConvert, setConfirmingConvert] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmingDelete(false);
  };

  return (
    <div
      style={{ background: '#FFFFFF', border: '1px solid var(--line)' }}
      className="rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{entry.targetName}</span>
          {entry.relationship && (
            <span style={{ background: meta.soft, color: meta.color }} className="text-xs px-1.5 py-0.5 rounded-full">
              {entry.relationship}
            </span>
          )}
        </div>
        {entry.note && (
          <p style={{ color: 'var(--ink-soft)' }} className="text-xs italic mt-0.5 whitespace-pre-wrap break-words">
            {entry.note}
          </p>
        )}
        {entry.prayerName && (
          <p style={{ color: 'var(--ink-soft)' }} className="text-xs mt-0.5">
            기도자 {entry.prayerName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {entry.status === 'seed' ? (
          <>
            {canEdit && (
              <button onClick={() => setConfirmingConvert(true)} title="믿음 가지게 됨" style={{ color: STATUS.fruit.color }}>
                <Sparkles size={17} />
              </button>
            )}

            {confirmingConvert && (
              <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
                <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setConfirmingConvert(false)} />
                <div
                  style={{ background: '#FFFDF9', color: 'var(--ink)' }}
                  className="relative rounded-3xl px-6 py-7 flex flex-col items-center gap-4 shadow-xl text-center max-w-xs"
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                    {canShare ? '나의' : `${entry.prayerName}님의`} 기도를 정말 믿음열매로 바꾸시겠어요?
                  </p>
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
              onClick={() => onPray(entry.id)}
              style={{ color: prayedToday ? meta.color : 'var(--ink-soft)' }}
              className="flex flex-col items-center gap-0.5"
            >
              <Flame size={16} fill={prayedToday ? meta.color : 'none'} />
              <span style={{ fontSize: '9px', lineHeight: '10px' }}>
                기도했어요{prayedToday ? '!' : ''} ({entry.prayerCount})
              </span>
            </button>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--ink-soft)' }} className="flex flex-col items-center gap-0.5" title="기도한 횟수 (고정됨)">
              <Flame size={15} fill="var(--ink-soft)" />
              <span style={{ fontSize: '9px', lineHeight: '10px' }}>{entry.prayerCount}회</span>
            </div>
            <button onClick={() => onLike(entry.id)} style={{ color: STATUS.fruit.color }} className="flex flex-col items-center gap-0.5">
              <Heart size={17} fill={likeCount > 0 ? STATUS.fruit.color : 'none'} />
              <span style={{ fontSize: '9px', lineHeight: '10px' }}>{likeCount}</span>
            </button>
          </>
        )}

        {canEdit && (
          <button onClick={() => setMenuOpen(true)} style={{ color: 'var(--ink-soft)' }} aria-label="더보기">
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {menuOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={closeMenu} />
          <div
            style={{ background: 'var(--paper, #FFF8F0)', color: 'var(--ink)' }}
            className="relative w-full rounded-3xl shadow-xl px-5 py-6 flex flex-col gap-1"
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }} className="mb-2">
              {entry.targetName}
            </p>
            <button
              onClick={() => {
                closeMenu();
                onEditEntry(entry);
              }}
              className="flex items-center gap-2.5 text-sm py-2.5"
            >
              <Pencil size={15} /> 수정하기
            </button>
            {canShare && !entry.linkedRef && onShare && (
              <button
                onClick={() => {
                  closeMenu();
                  onShare(entry);
                }}
                className="flex items-center gap-2.5 text-sm py-2.5"
              >
                <Share2 size={15} /> {shareLabel}
              </button>
            )}
            <button
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                closeMenu();
                onDeleteEntry(entry);
              }}
              style={{ color: confirmingDelete ? '#C4456B' : 'var(--ink)' }}
              className="flex items-center gap-2.5 text-sm py-2.5"
            >
              <Trash2 size={15} /> {confirmingDelete ? '한 번 더 누르면 삭제돼요' : '삭제하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
