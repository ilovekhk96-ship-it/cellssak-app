import { useState } from 'react';
import { Users } from 'lucide-react';

export default function CellMenu({ onOpenMembers, onOpenAdmin }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm shrink-0"
      >
        <Users size={13} /> 셀원
      </button>

      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-30" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000033' }} className="absolute inset-0" onClick={() => setOpen(false)} />
          <div
            style={{ background: 'var(--paper, #FFF8F0)', color: 'var(--ink, #4A3B3F)' }}
            className="relative w-full rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-2"
          >
            <button
              onClick={() => {
                setOpen(false);
                onOpenMembers();
              }}
              style={{ background: '#F5F0E8' }}
              className="text-left rounded-2xl px-4 py-3 text-sm font-medium"
            >
              셀원 목록
            </button>
            {onOpenAdmin && (
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenAdmin();
                }}
                style={{ background: '#F5F0E8' }}
                className="text-left rounded-2xl px-4 py-3 text-sm font-medium"
              >
                가입승인
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
