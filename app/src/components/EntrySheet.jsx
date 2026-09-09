import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUS } from '../data/constants';

export default function EntrySheet({ form, setForm, onClose, onSave }) {
  const selectedStatus = form.status;
  const [pendingStatus, setPendingStatus] = useState(null); // 상태 전환 확인 대기 중인 값

  const applyPendingStatus = () => {
    setForm({ ...form, status: pendingStatus });
    setPendingStatus(null);
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center z-20" style={{ maxWidth: '384px', margin: '0 auto' }}>
      <div style={{ background: '#00000033' }} className="absolute inset-0" onClick={onClose} />

      {pendingStatus && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setPendingStatus(null)} />
          <div
            style={{ background: '#FFFDF9', color: 'var(--ink)' }}
            className="relative rounded-3xl px-6 py-7 flex flex-col items-center gap-4 shadow-xl text-center max-w-xs"
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              정말 {STATUS[pendingStatus].label}(으)로 바꾸시겠어요?
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setPendingStatus(null)}
                style={{ background: '#E8DADB', color: 'var(--ink)' }}
                className="flex-1 py-2.5 rounded-full text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={applyPendingStatus}
                style={{ background: STATUS[pendingStatus].color, color: '#FFF8F0' }}
                className="flex-1 py-2.5 rounded-full text-sm font-medium"
              >
                바꾸기
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: 'var(--paper)', fontFamily: 'var(--font-body)' }} className="relative w-full rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }} className="font-bold">
            정보 수정하기
          </span>
          <button onClick={onClose} style={{ color: 'var(--ink-soft)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1.5">
          {['seed', 'fruit'].map((key) => {
            const optionMeta = STATUS[key];
            const selected = selectedStatus === key;
            return (
              <button
                key={key}
                onClick={() => key !== selectedStatus && setPendingStatus(key)}
                style={{
                  background: selected ? optionMeta.color : optionMeta.soft,
                  color: selected ? '#FFF8F0' : optionMeta.color,
                }}
                className="text-xs rounded-full px-3 py-1.5 font-medium"
              >
                {optionMeta.label}
              </button>
            );
          })}
        </div>

        <input
          value={form.prayerName}
          onChange={(e) => setForm({ ...form, prayerName: e.target.value })}
          placeholder="기도자 이름"
          style={{ borderBottom: '1px solid var(--line)' }}
          className="bg-transparent outline-none py-2 text-base"
          autoFocus
        />
        <input
          value={form.targetName}
          onChange={(e) => setForm({ ...form, targetName: e.target.value })}
          placeholder="대상자 이름"
          style={{ borderBottom: '1px solid var(--line)' }}
          className="bg-transparent outline-none py-2 text-base"
        />
        <input
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          placeholder="관계 (예: 가족, 친구, 직장동료)"
          style={{ borderBottom: '1px solid var(--line)' }}
          className="bg-transparent outline-none py-2 text-sm"
        />
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="기도제목 (선택)"
          rows={2}
          style={{ borderBottom: '1px solid var(--line)' }}
          className="bg-transparent outline-none py-2 text-sm resize-none"
        />

        <button onClick={onSave} style={{ background: STATUS.seed.color, color: '#FFF8F0' }} className="w-full py-3 rounded-full text-sm font-medium mt-1">
          저장하기
        </button>
      </div>
    </div>
  );
}
