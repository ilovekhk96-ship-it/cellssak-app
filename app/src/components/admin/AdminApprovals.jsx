import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { listenPendingRequests, approveRequest, rejectRequest } from '../../lib/church';

export default function AdminApprovals({ churchId, cellId }) {
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

  if (loading) {
    return (
      <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
        불러오는 중...
      </p>
    );
  }

  if (requests.length === 0) {
    return (
      <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
        대기 중인 가입 신청이 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {requests.map((request) => (
        <div
          key={request.id}
          style={{ background: '#FFFDF9' }}
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
  );
}
