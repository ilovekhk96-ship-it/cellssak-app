import { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import { getChurch, getCell, listenJoinRequest, cancelJoinRequest, clearPendingRequest, setActiveCell } from '../../lib/church';

export default function PendingApproval({ user, pendingRequest, onBackHome }) {
  const { churchId, cellId } = pendingRequest;
  const [names, setNames] = useState(null);
  const [status, setStatus] = useState('pending');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getChurch(churchId), getCell(churchId, cellId)]).then(([church, cell]) => {
      setNames({ church: church?.name || '', cell: cell?.name || '' });
    });
  }, [churchId, cellId]);

  useEffect(() => {
    const unsubscribe = listenJoinRequest(churchId, cellId, user.uid, (data) => {
      if (!data) return;
      setStatus(data.status);
      if (data.status === 'approved') {
        setActiveCell(user.uid, churchId, cellId);
      }
    });
    return unsubscribe;
  }, [churchId, cellId, user.uid]);

  const handleCancel = async () => {
    setBusy(true);
    await cancelJoinRequest(churchId, cellId, user.uid);
    await clearPendingRequest(user.uid);
  };

  const handlePickAgain = async () => {
    setBusy(true);
    await clearPendingRequest(user.uid);
  };

  return (
    <div
      style={{ background: "url('/images/bg-field.jpg') center 72% / cover no-repeat" }}
      className="w-full min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center"
    >
      {status === 'rejected' ? (
        <>
          <p style={{ color: '#4A3B3F' }} className="text-base font-medium">
            {names ? `${names.church} · ${names.cell}` : ''} 가입이 거절되었어요
          </p>
          <button
            onClick={handlePickAgain}
            disabled={busy}
            style={{ background: '#FFFDF9', color: '#4A3B3F' }}
            className="px-5 py-2.5 rounded-full text-sm font-medium shadow-md disabled:opacity-50"
          >
            다른 셀 찾아보기
          </button>
        </>
      ) : (
        <>
          <Hourglass size={28} style={{ color: '#4A3B3F' }} />
          <div>
            <p style={{ color: '#4A3B3F' }} className="text-base font-medium mb-1">
              {names ? `${names.church} · ${names.cell}` : '가입 신청'}
            </p>
            <p style={{ color: '#4A3B3F' }} className="text-sm opacity-80">
              리더의 승인을 기다리고 있어요
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={busy}
            style={{ color: '#4A3B3F' }}
            className="text-sm underline underline-offset-2 disabled:opacity-50"
          >
            신청 취소
          </button>
        </>
      )}
      {onBackHome && (
        <button
          onClick={onBackHome}
          style={{ color: '#4A3B3F' }}
          className="text-xs underline underline-offset-2 opacity-70"
        >
          내 기도나무로 돌아가기
        </button>
      )}
    </div>
  );
}
