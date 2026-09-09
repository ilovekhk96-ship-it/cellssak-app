import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

function requestsCol(uid) {
  return collection(db, 'users', uid, 'prayerRequests');
}

function dailyActivityCol(uid) {
  return collection(db, 'users', uid, 'dailyActivity');
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
    prayerCount: 0,
    lastPrayedDate: null,
    createdAt: serverTimestamp(),
  });
}

export async function updatePersonalRequest(uid, reqId, patch) {
  await updateDoc(doc(db, 'users', uid, 'prayerRequests', reqId), patch);
}

export async function deletePersonalRequest(uid, reqId) {
  await deleteDoc(doc(db, 'users', uid, 'prayerRequests', reqId));
}

export async function prayForPersonalRequest(uid, reqId, today) {
  await updatePersonalRequest(uid, reqId, { prayerCount: increment(1), lastPrayedDate: today });
}

// 날짜별로 그날 기도했는지 여부를 실시간으로 구독 (개인 기도나무 성장의 근거 데이터) —
// 셀 나무의 dailyPrayers와 같은 원리지만 개인은 본인 한 명뿐이라 이름 배열 대신 존재 여부만 기록
export function listenPersonalDailyActivity(uid, callback) {
  return onSnapshot(dailyActivityCol(uid), (snap) => {
    const map = {};
    snap.forEach((d) => {
      map[d.id] = true;
    });
    callback(map);
  });
}

export async function logPersonalPrayerForToday(uid, date) {
  await setDoc(doc(db, 'users', uid, 'dailyActivity', date), { active: true }, { merge: true });
}
