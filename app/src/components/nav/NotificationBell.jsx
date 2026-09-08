import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#FFFDF9', color: '#4A3B3F', width: '30px', height: '30px' }}
        className="flex items-center justify-center rounded-full shadow-sm shrink-0"
        aria-label="알림"
      >
        <Bell size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setOpen(false)} />
          <div
            style={{ background: 'var(--paper, #FFF8F0)', color: 'var(--ink, #4A3B3F)' }}
            className="relative w-full rounded-3xl shadow-xl px-5 py-6 flex flex-col gap-2"
          >
            <p style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif" }} className="text-lg mb-1">
              알림
            </p>
            <p style={{ color: '#9C8286' }} className="text-sm text-center py-8">
              아직 알림이 없어요.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
