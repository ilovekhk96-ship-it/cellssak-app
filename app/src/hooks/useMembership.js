import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureUserDoc } from '../lib/church';

// users/{uid} 문서를 실시간으로 구독 — activeCell/pendingRequest가 바뀌면(가입 승인 등) 자동으로 반영됨
export function useMembership(user) {
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setUserDoc(null);
      return;
    }
    let unsubscribe;
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        await ensureUserDoc(user);
        if (cancelled) return;
        unsubscribe = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            setUserDoc(snap.exists() ? snap.data() : null);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { loading, userDoc, error };
}
