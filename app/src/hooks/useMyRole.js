import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 내 members/{uid} 문서를 실시간 구독 — 리더 양도가 일어나도 즉시 반영됨
export function useMyRole(churchId, cellId, uid) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!churchId || !cellId || !uid) {
      setRole(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'churches', churchId, 'cells', cellId, 'members', uid), (snap) => {
      setRole(snap.exists() ? snap.data().role : null);
    });
    return unsubscribe;
  }, [churchId, cellId, uid]);

  return role;
}
