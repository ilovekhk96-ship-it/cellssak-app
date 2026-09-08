import { useState, useEffect } from 'react';
import { ChevronLeft, Check, X } from 'lucide-react';
import { listenPendingRequests, approveRequest, rejectRequest } from '../../lib/church';

export default function AdminApprovals({ churchId, cellId, onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsubscribe = listenPendingRequests(churchId, cellId, (list) => {
      setRequests(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [churchId, cellId]);

  const handleApprove = async (request) => {
    setBusyId(request.id);
    try {
      await approveRequest(churchId, cellId, request);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (request) => {
    setBusyId(request.id);
    try {
      await rejectRequest(churchId, cellId, request.uid);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      style={{ background: 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)' }}
      className="w-full min-h-screen"
    >
      <div className="max-w-sm mx-auto min-h-screen flex flex-col px-5 pt-8 pb-6">
        <button onClick={onBack} style={{ color: '#4A3B3F' }} className="flex items-center gap-1 text-sm mb-4 w-fit">
          <ChevronLeft size={16} /> 셀로 돌아가기
        </button>

        <h1 style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", color: '#4A3B3F' }} className="text-2xl mb-1">
          가입 승인
        </h1>
        <p style={{ color: '#4A3B3F' }} className="text-sm mb-5 opacity-80">
          대기 중인 신청 {requests.length}건
        </p>

        <div style={{ background: '#FFFDF9' }} className="rounded-3xl shadow-sm flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
              불러오는 중...
            </p>
          ) : requests.length === 0 ? (
            <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
              대기 중인 가입 신청이 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {requests.map((request) => (
                <div
                  key={request.id}
                  style={{ background: '#F5F0E8' }}
                  className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
                >
                  {request.photoURL && (
                    <img src={request.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shrink-0" />
                  )}
                  <span style={{ color: '#4A3B3F' }} className="text-sm font-medium flex-1 min-w-0 truncate">
                    {request.displayName}
                  </span>
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={busyId === request.id}
                    style={{ background: '#6FA66B', color: '#FFF8F0' }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={busyId === request.id}
                    style={{ background: '#E8DADB', color: '#C4456B' }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
