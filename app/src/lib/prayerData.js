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
  writeBatch,
  serverTimestamp,
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
  await addDoc(entriesCol(churchId, cellId), { linkedRef: null, ...data });
}

export async function updateEntry(churchId, cellId, entryId, patch) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId), patch);
}

export async function deleteEntry(churchId, cellId, entryId) {
  await deleteDoc(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId));
}

// 삭제하면서, 연결된 개인 기도제목이 있고(+ 지금 지우는 사람이 이 항목의 작성자 본인일 때만)
// 그쪽의 연결 표시도 같이 지워서 나중에 다시 공유할 수 있게 함
export async function deleteEntryWithUnlink(churchId, cellId, entry, actingUid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entry.id));
  if (entry.linkedRef && entry.authorUid === actingUid) {
    batch.update(doc(db, 'users', entry.linkedRef.uid, 'prayerRequests', entry.linkedRef.reqId), { linkedRef: null });
  }
  await batch.commit();
}

export async function prayForEntry(churchId, cellId, entryId, today) {
  await updateEntry(churchId, cellId, entryId, { prayerCount: increment(1), lastPrayedDate: today });
}

export async function likeEntry(churchId, cellId, entryId) {
  await updateEntry(churchId, cellId, entryId, { likeCount: increment(1) });
}

// 상태(기도씨앗/믿음열매) 변경 — 개인 기도나무와 연결(linkedRef)돼 있고, 지금 조작하는 사람이
// 그 항목의 작성자 본인일 때만 개인 쪽도 같이 바꿔줌 (다른 셀원이 바꿀 땐 권한이 없어 동기화하지 않고
// 셀 쪽만 반영 — 개인 컬렉션은 본인만 쓸 수 있기 때문)
export async function setEntryStatus(churchId, cellId, entry, status, actingUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'churches', churchId, 'cells', cellId, 'entries', entry.id), { status });
  if (entry.linkedRef && entry.authorUid === actingUid) {
    batch.update(doc(db, 'users', entry.linkedRef.uid, 'prayerRequests', entry.linkedRef.reqId), { status });
  }
  await batch.commit();
}

// 개인 기도제목을 셀 나무로 공유 — 새 셀 항목을 만들고, 원본 개인 항목에도 linkedRef를 남겨
// 서로 연결(양쪽 다 같은 사람이 작성자일 때만 호출됨)
export async function shareRequestToCell(churchId, cellId, uid, request) {
  const batch = writeBatch(db);
  const cellRef = doc(entriesCol(churchId, cellId));
  const personalRef = doc(db, 'users', uid, 'prayerRequests', request.id);
  batch.set(cellRef, {
    targetName: request.targetName,
    prayerName: request.prayerName,
    relationship: request.relationship || '',
    note: request.note || '',
    status: request.status,
    prayerCount: 0,
    lastPrayedDate: null,
    likeCount: 0,
    authorUid: uid,
    linkedRef: { uid, reqId: request.id },
    createdAt: Date.now(),
  });
  batch.update(personalRef, { linkedRef: { churchId, cellId, entryId: cellRef.id } });
  await batch.commit();
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
