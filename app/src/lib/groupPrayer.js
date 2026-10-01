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
} from 'firebase/firestore';
import { db } from './firebase';

// 함께 기도 약속 — "목요일 밤 10시에 시편 23편 읽고 같이 기도하자"를 셀장이 미리 잡아두고,
// 시간이 되면 셀원들이 같은 말씀 앞에 모인다. 셀 아래에 두는 이유는 약속이 셀 단위이고
// 보안 규칙도 셀원 여부로 그대로 걸 수 있기 때문.
//
// 진행 방식(mode)
//   'leader' — 인도자가 다음 장으로 넘기면 모두의 화면이 같이 넘어감(currentIndex를 공유)
//   'self'   — 같은 시간·같은 말씀이지만 읽는 속도는 각자
function groupPrayersCol(churchId, cellId) {
  return collection(db, 'churches', churchId, 'cells', cellId, 'groupPrayers');
}

function groupPrayerDoc(churchId, cellId, id) {
  return doc(db, 'churches', churchId, 'cells', cellId, 'groupPrayers', id);
}

// 약속 목록 — 시작 시각 순. 지난 약속도 같이 와서 화면 쪽에서 다가오는 것/지난 것을 나눈다
// onError를 받는 이유: 구독이 실패해도(권한 없음, 네트워크 끊김) 화면이 "불러오는 중"에서
// 영원히 멈추지 않게 하기 위함. 실패를 조용히 삼키면 사용자는 빈 화면만 보게 된다
export function listenGroupPrayers(churchId, cellId, callback, onError) {
  const q = query(groupPrayersCol(churchId, cellId), orderBy('scheduledAt'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => onError && onError(err)
  );
}

// 약속 하나만 실시간 구독 — 인도자가 넘긴 현재 장(currentIndex)이 여기로 흘러온다
export function listenGroupPrayer(churchId, cellId, id, callback) {
  return onSnapshot(groupPrayerDoc(churchId, cellId, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function createGroupPrayer(churchId, cellId, { title, scheduledAt, passages, mode, leaderUid }) {
  await addDoc(groupPrayersCol(churchId, cellId), {
    title,
    scheduledAt,
    // 말씀은 장(章) 단위 배열 — [{ ref: '시편 23:1-3', text: '...' }, ...].
    // 인도자 진행일 때 이 배열을 한 장씩 넘긴다. 한 덩어리면 길이 1짜리 배열
    passages,
    mode,
    leaderUid,
    currentIndex: 0,
    status: 'scheduled', // 'scheduled' | 'live' | 'ended'
    createdAt: serverTimestamp(),
  });
}

export async function updateGroupPrayer(churchId, cellId, id, patch) {
  await updateDoc(groupPrayerDoc(churchId, cellId, id), patch);
}

export async function deleteGroupPrayer(churchId, cellId, id) {
  await deleteDoc(groupPrayerDoc(churchId, cellId, id));
}

// 인도자가 장을 넘김 — 'leader' 모드에서만 의미가 있고, 구독 중인 모두의 화면이 따라 넘어간다
export async function setCurrentIndex(churchId, cellId, id, index) {
  await updateDoc(groupPrayerDoc(churchId, cellId, id), { currentIndex: index });
}

export async function setGroupPrayerStatus(churchId, cellId, id, status) {
  await updateDoc(groupPrayerDoc(churchId, cellId, id), { status });
}

// 지금 함께 있는 사람 — 들어올 때 자기 문서를 쓰고 나갈 때 지운다. 앱이 갑자기 꺼져서
// 지우지 못하는 경우가 있으므로, 화면 쪽에서 lastSeenAt이 오래된 사람은 빼고 센다
function participantsCol(churchId, cellId, id) {
  return collection(db, 'churches', churchId, 'cells', cellId, 'groupPrayers', id, 'participants');
}

export function listenParticipants(churchId, cellId, id, callback) {
  return onSnapshot(participantsCol(churchId, cellId, id), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

export async function joinGroupPrayer(churchId, cellId, id, user) {
  await setDoc(
    doc(participantsCol(churchId, cellId, id), user.uid),
    {
      displayName: user.displayName || '',
      photoURL: user.photoURL || null,
      joinedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// 접속해 있는 동안 주기적으로 불러서 "아직 있음"을 알린다
export async function touchParticipant(churchId, cellId, id, uid) {
  await setDoc(doc(participantsCol(churchId, cellId, id), uid), { lastSeenAt: serverTimestamp() }, { merge: true });
}

export async function leaveGroupPrayer(churchId, cellId, id, uid) {
  await deleteDoc(doc(participantsCol(churchId, cellId, id), uid));
}

// 채팅 — 기도 중에 짧게 주고받는 용도라 오래된 것까지 다 불러올 필요가 없다
function messagesCol(churchId, cellId, id) {
  return collection(db, 'churches', churchId, 'cells', cellId, 'groupPrayers', id, 'messages');
}

export function listenMessages(churchId, cellId, id, callback) {
  const q = query(messagesCol(churchId, cellId, id), orderBy('createdAt'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(churchId, cellId, id, user, text) {
  await addDoc(messagesCol(churchId, cellId, id), {
    uid: user.uid,
    displayName: user.displayName || '',
    photoURL: user.photoURL || null,
    text,
    createdAt: serverTimestamp(),
  });
}

// --- 화면에서 쓰는 계산들 ---

// 약속이 "지금 들어갈 수 있는" 상태인지 — 시작 10분 전부터 끝난 뒤 2시간까지 열어둔다.
// 늦게 들어와도 함께할 수 있어야 하고, 끝나고 한참 지난 약속이 계속 떠 있으면 안 되므로
const OPEN_BEFORE_MS = 10 * 60 * 1000;
const OPEN_AFTER_MS = 2 * 60 * 60 * 1000;

export function groupPrayerPhase(gp, now = Date.now()) {
  if (gp.status === 'ended') return 'ended';
  const start = toMillis(gp.scheduledAt);
  if (start == null) return 'scheduled';
  if (now < start - OPEN_BEFORE_MS) return 'upcoming';
  if (now > start + OPEN_AFTER_MS) return 'ended';
  return 'open';
}

export function toMillis(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds != null) return value.seconds * 1000;
  return null;
}

// 접속이 끊겼는데 문서가 남은 사람을 빼고 센다
const PRESENCE_STALE_MS = 90 * 1000;

export function livePresence(participants, now = Date.now()) {
  return participants.filter((p) => {
    const seen = toMillis(p.lastSeenAt);
    return seen == null || now - seen < PRESENCE_STALE_MS;
  });
}
