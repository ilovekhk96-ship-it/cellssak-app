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
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

function entriesCol(churchId, cellId) {
  return collection(db, 'churches', churchId, 'cells', cellId, 'entries');
}

function dailyCol(churchId, cellId) {
  return collection(db, 'churches', churchId, 'cells', cellId, 'dailyPrayers');
}

// 셀의 기도 대상자 목록을 실시간으로 구독 — 셀원 누구든 추가/기도/열매전환하면 모두에게 즉시 반영됨
export function listenEntries(churchId, cellId, callback) {
  const q = query(entriesCol(churchId, cellId), orderBy('createdAt'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addEntry(churchId, cellId, data) {
  await addDoc(entriesCol(churchId, cellId), data);
}

export async function updateEntry(churchId, cellId, entryId, patch) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId), patch);
}

export async function deleteEntry(churchId, cellId, entryId) {
  await deleteDoc(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId));
}

export async function prayForEntry(churchId, cellId, entryId, today) {
  await updateEntry(churchId, cellId, entryId, { prayerCount: increment(1), lastPrayedDate: today });
}

export async function likeEntry(churchId, cellId, entryId) {
  await updateEntry(churchId, cellId, entryId, { likeCount: increment(1) });
}

// 날짜별로 그날 '기도했어요'를 누른 사람 이름 목록을 실시간으로 구독 (나무 성장의 근거 데이터)
export function listenDailyPrayers(churchId, cellId, callback) {
  return onSnapshot(dailyCol(churchId, cellId), (snap) => {
    const map = {};
    snap.forEach((d) => {
      map[d.id] = d.data().names || [];
    });
    callback(map);
  });
}

// arrayUnion으로 같은 사람이 같은 날 여러 항목에 눌러도 자동으로 중복 제거됨 (uid 기준)
export async function logPrayerForToday(churchId, cellId, date, uid) {
  if (!uid) return;
  const ref = doc(db, 'churches', churchId, 'cells', cellId, 'dailyPrayers', date);
  await setDoc(ref, { names: arrayUnion(uid) }, { merge: true });
}
