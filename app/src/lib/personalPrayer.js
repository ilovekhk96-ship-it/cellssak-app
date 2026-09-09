import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

function requestsCol(uid) {
  return collection(db, 'users', uid, 'prayerRequests');
}

// 개인 기도제목 목록을 실시간으로 구독 — 본인만 볼 수 있음
export function listenPersonalRequests(uid, callback) {
  const q = query(requestsCol(uid), orderBy('createdAt'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addPersonalRequest(uid, content) {
  await addDoc(requestsCol(uid), {
    content,
    status: 'seed',
    createdAt: serverTimestamp(),
  });
}

export async function updatePersonalRequest(uid, reqId, patch) {
  await updateDoc(doc(db, 'users', uid, 'prayerRequests', reqId), patch);
}

export async function deletePersonalRequest(uid, reqId) {
  await deleteDoc(doc(db, 'users', uid, 'prayerRequests', reqId));
}
