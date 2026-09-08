import { useState, useEffect } from 'react';
import { Crown, LogOut } from 'lucide-react';
import { listenMembers, transferLeadership, leaveCell } from '../../lib/church';

export default function MemberList({ churchId, cellId, myUid, myRole }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState(null);
  const [confirmUid, setConfirmUid] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const canLeave = myRole !== 'leader' || members.length <= 1;

  useEffect(() => {
    const unsubscribe = listenMembers(churchId, cellId, (list) => {
      setMembers(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [churchId, cellId]);

  const handleTransfer = async (toUid) => {
    if (confirmUid !== toUid) {
      setConfirmUid(toUid);
      return;
    }
    setBusyUid(toUid);
    try {
      await transferLeadership(churchId, cellId, myUid, toUid);
    } finally {
      setBusyUid(null);
      setConfirmUid(null);
    }
  };

  const handleLeave = async () => {
    if (!canLeave) return;
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    setLeaving(true);
    setLeaveError('');
    try {
      await leaveCell(churchId, cellId, myUid);
      // activeCell이 비워지면서 자동으로 교회/셀 선택 화면으로 돌아감
    } catch (e) {
      setLeaving(false);
      setConfirmLeave(false);
      setLeaveError(e.message || '나가기에 실패했어요.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
          불러오는 중...
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((member) => (
            <div
              key={member.id}
              style={{ background: '#FFFDF9' }}
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
            >
              {member.photoURL && (
                <img src={member.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shrink-0" />
              )}
              <span style={{ color: '#4A3B3F' }} className="flex items-center gap-1 text-sm font-medium flex-1 min-w-0 truncate">
                {member.displayName}
                {member.role === 'leader' && <Crown size={14} style={{ color: '#E8A93C' }} />}
              </span>
              {myRole === 'leader' && member.id !== myUid && (
                <button
                  onClick={() => handleTransfer(member.id)}
                  disabled={busyUid === member.id}
                  style={{
                    background: confirmUid === member.id ? '#F2678A' : '#E8DADB',
                    color: confirmUid === member.id ? '#FFF8F0' : '#4A3B3F',
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-full font-medium disabled:opacity-50 shrink-0"
                >
                  {confirmUid === member.id ? '확정' : '리더 넘기기'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-1 pt-2">
        {canLeave ? (
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{ color: confirmLeave ? '#C4456B' : '#4A3B3F' }}
            className="flex items-center gap-1.5 text-sm disabled:opacity-50"
          >
            <LogOut size={14} />
            {confirmLeave ? '한 번 더 누르면 나가져요' : '이 셀 나가기'}
          </button>
        ) : (
          <p style={{ color: '#4A3B3F' }} className="text-xs text-center opacity-70">
            리더는 다른 셀원에게 리더를 넘긴 후에 나갈 수 있어요
          </p>
        )}
        {leaveError && (
          <p style={{ color: '#C4456B' }} className="text-xs text-center mt-1">
            {leaveError}
          </p>
        )}
      </div>
    </div>
  );
}
