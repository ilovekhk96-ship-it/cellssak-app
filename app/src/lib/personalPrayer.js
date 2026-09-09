import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

function requestsCol(uid) {
  return collection(db, 'users', uid, 'prayerRequests');
}

function dailyActivityCol(uid) {
  return collection(db, 'users', uid, 'dailyActivity');
}

// 개인 기도제목 목록을 실시간으로 구독 — 본인만 볼 수 있음. 셀 entries와 같은 필드 구조를
// 써서(targetName/relationship/note/status/...) EntryRow·ListModal을 그대로 재사용할 수 있게 함
export function listenPersonalRequests(uid, callback) {
  const q = query(requestsCol(uid), orderBy('createdAt'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addPersonalRequest(uid, data) {
  await addDoc(requestsCol(uid), {
    ...data,
    status: 'seed',
    prayerCount: 0,
    lastPrayedDate: null,
    likeCount: 0,
    linkedRef: null,
    createdAt: serverTimestamp(),
  });
}

export async function updatePersonalRequest(uid, reqId, patch) {
  await updateDoc(doc(db, 'users', uid, 'prayerRequests', reqId), patch);
}

export async function deletePersonalRequest(uid, reqId) {
  await deleteDoc(doc(db, 'users', uid, 'prayerRequests', reqId));
}

// 삭제하면서, 연결된 셀 항목이 아직 남아있으면 그쪽의 연결 표시도 같이 지워서 나중에 다시
// 공유할 수 있게 함 (개인 컬렉션은 항상 본인 소유라 연결된 셀 항목도 항상 같은 사람이
// 작성자라 권한 문제 없음). 연결된 문서가 이미 지워져 있으면(상대가 먼저 지운 경우) 배치에서
// 존재하지 않는 문서를 update하면 전체 배치가 실패하므로, 먼저 존재를 확인한 뒤에만 같이 지움
export async function deletePersonalRequestWithUnlink(uid, request) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid, 'prayerRequests', request.id));
  if (request.linkedRef) {
    const { churchId, cellId, entryId } = request.linkedRef;
    const linkedRef = doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId);
    const linkedSnap = await getDoc(linkedRef);
    if (linkedSnap.exists()) {
      batch.update(linkedRef, { linkedRef: null });
    }
  }
  await batch.commit();
}

export async function prayForPersonalRequest(uid, reqId, today) {
  await updatePersonalRequest(uid, reqId, { prayerCount: increment(1), lastPrayedDate: today });
}

export async function likePersonalRequest(uid, reqId) {
  await updatePersonalRequest(uid, reqId, { likeCount: increment(1) });
}

// 내용/상태 수정 — 셀 쪽과 연결(linkedRef)돼 있으면 그쪽도 같은 내용으로 같이 바꿔줌.
// 개인 컬렉션은 항상 본인 소유라 연결된 셀 쪽 문서도 항상 같은 사람이 작성자이므로 권한 문제
// 없음. 연결된 문서가 이미 지워졌으면(상대가 먼저 지운 경우) 동기화를 건너뛰고 개인 쪽만 반영
export async function updatePersonalRequestWithSync(uid, request, patch) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid, 'prayerRequests', request.id), patch);
  if (request.linkedRef) {
    const { churchId, cellId, entryId } = request.linkedRef;
    const linkedRef = doc(db, 'churches', churchId, 'cells', cellId, 'entries', entryId);
    const linkedSnap = await getDoc(linkedRef);
    if (linkedSnap.exists()) {
      batch.update(linkedRef, patch);
    }
  }
  await batch.commit();
}

// 셀 항목을 내 개인 기도나무로 복사 — 새 개인 문서를 만들고, 원본 셀 항목에도 linkedRef를 남겨
// 서로 연결(양쪽 다 같은 사람이 작성자일 때만 호출됨)
export async function copyEntryToPersonal(uid, churchId, cellId, entry) {
  const batch = writeBatch(db);
  const personalRef = doc(requestsCol(uid));
  const cellRef = doc(db, 'churches', churchId, 'cells', cellId, 'entries', entry.id);
  batch.set(personalRef, {
    type: entry.type || 'intercession',
    targetName: entry.targetName,
    prayerName: entry.prayerName,
    relationship: entry.relationship || '',
    note: entry.note || '',
    status: entry.status,
    prayerCount: 0,
    lastPrayedDate: null,
    likeCount: 0,
    linkedRef: { churchId, cellId, entryId: entry.id },
    createdAt: serverTimestamp(),
  });
  batch.update(cellRef, { linkedRef: { uid, reqId: personalRef.id } });
  await batch.commit();
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
