import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUS } from '../../data/constants';
import { addEntry } from '../../lib/prayerData';
import { addPersonalRequest } from '../../lib/personalPrayer';

// 기도씨앗 추가하기 — "나의 기도"(개인 전용)와 "중보기도"(셀 공유) 중 골라서 등록.
// 내 기도나무/셀 나무 어느 화면에서 열든 동일한 방식으로 동작함.
export default function AddEntrySheet({ user, activeCell, defaultType = 'mine', onClose, onAdded }) {
  const [type, setType] = useState(activeCell ? defaultType : 'mine');
  const [targetName, setTargetName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (saving) return;
    setError('');
    try {
      if (type === 'mine') {
        const text = content.trim();
        if (!text) return;
        setSaving(true);
        await addPersonalRequest(user.uid, text);
        onAdded && onAdded('mine');
      } else {
        const name = targetName.trim();
        if (!name) return;
        setSaving(true);
        await addEntry(activeCell.churchId, activeCell.cellId, {
          targetName: name,
          prayerName: user.displayName,
          relationship: relationship.trim(),
          note: content.trim(),
          status: 'seed',
          prayerCount: 0,
          lastPrayedDate: null,
          likeCount: 0,
          createdAt: Date.now(),
          authorUid: user.uid,
        });
        onAdded && onAdded('intercession', name);
      }
      onClose();
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" style={{ maxWidth: '384px', margin: '0 auto' }}>
      <div style={{ background: '#00000033' }} className="absolute inset-0" onClick={onClose} />
      <div
        style={{ background: 'var(--paper, #FFF8F0)', fontFamily: "'Gowun Dodum', sans-serif" }}
        className="relative w-full rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }} className="font-bold">
            기도씨앗 심기
          </span>
          <button onClick={onClose} style={{ color: 'var(--ink-soft, #9C8286)' }}>
            <X size={20} />
          </button>
        </div>

        {activeCell && (
          <div className="flex gap-1.5">
            {[
              { key: 'mine', label: '나의 기도' },
              { key: 'intercession', label: '중보기도' },
            ].map((opt) => {
              const selected = type === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  style={{
                    background: selected ? STATUS.seed.color : STATUS.seed.soft,
                    color: selected ? '#FFF8F0' : STATUS.seed.color,
                  }}
                  className="text-xs rounded-full px-3 py-1.5 font-medium"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {type === 'intercession' && (
          <>
            <input
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="대상자 이름"
              style={{ borderBottom: '1px solid var(--line, #F0E2E3)' }}
              className="bg-transparent outline-none py-2 text-base"
              autoFocus
            />
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="관계 (예: 가족, 친구, 직장동료)"
              style={{ borderBottom: '1px solid var(--line, #F0E2E3)' }}
              className="bg-transparent outline-none py-2 text-sm"
            />
          </>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="기도제목"
          rows={type === 'mine' ? 4 : 2}
          style={{ borderBottom: '1px solid var(--line, #F0E2E3)' }}
          className="bg-transparent outline-none py-2 text-sm resize-none"
          autoFocus={type === 'mine'}
        />

        {error && (
          <p style={{ color: '#C4456B' }} className="text-xs -mt-1">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: STATUS.seed.color, color: '#FFF8F0' }}
          className="w-full py-3 rounded-full text-sm font-medium mt-1 disabled:opacity-50"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
