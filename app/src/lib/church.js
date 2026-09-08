import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

// ---------- 교회 ----------

export async function listChurches() {
  const snap = await getDocs(query(collection(db, 'churches'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getChurch(churchId) {
  const snap = await getDoc(doc(db, 'churches', churchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createChurch(name, uid) {
  const ref = doc(collection(db, 'churches'));
  await setDoc(ref, { name: name.trim(), createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}

// ---------- 셀 ----------

export async function listCells(churchId) {
  const snap = await getDocs(query(collection(db, 'churches', churchId, 'cells'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCell(churchId, cellId) {
  const snap = await getDoc(doc(db, 'churches', churchId, 'cells', cellId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// 셀 이름 변경 — 리더만 가능 (보안 규칙에서 강제)
export async function renameCell(churchId, cellId, name) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId), { name: name.trim() });
}

export function listenCell(churchId, cellId, callback) {
  return onSnapshot(doc(db, 'churches', churchId, 'cells', cellId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// 셀을 새로 만들면 만든 사람이 곧바로 리더가 됨 (승인 절차 없음)
export async function createCell(churchId, name, user) {
  const cellRef = doc(collection(db, 'churches', churchId, 'cells'));
  const memberRef = doc(db, 'churches', churchId, 'cells', cellRef.id, 'members', user.uid);
  const batch = writeBatch(db);
  batch.set(cellRef, { name: name.trim(), leaderUid: user.uid, memberCount: 1, createdAt: serverTimestamp() });
  batch.set(memberRef, {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    role: 'leader',
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return cellRef.id;
}

// ---------- 가입 신청 (신청자 본인) ----------

export async function submitJoinRequest(churchId, cellId, user) {
  const reqRef = doc(db, 'churches', churchId, 'cells', cellId, 'joinRequests', user.uid);
  await setDoc(reqRef, {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
}

export function listenJoinRequest(churchId, cellId, uid, callback) {
  const reqRef = doc(db, 'churches', churchId, 'cells', cellId, 'joinRequests', uid);
  return onSnapshot(reqRef, (snap) => callback(snap.exists() ? snap.data() : null));
}

export async function cancelJoinRequest(churchId, cellId, uid) {
  await deleteDoc(doc(db, 'churches', churchId, 'cells', cellId, 'joinRequests', uid));
}

// ---------- 가입 승인 관리 (리더) ----------

export function listenPendingRequests(churchId, cellId, callback) {
  const q = query(
    collection(db, 'churches', churchId, 'cells', cellId, 'joinRequests'),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function approveRequest(churchId, cellId, request) {
  const batch = writeBatch(db);
  const cellRef = doc(db, 'churches', churchId, 'cells', cellId);
  const memberRef = doc(db, 'churches', churchId, 'cells', cellId, 'members', request.uid);
  const reqRef = doc(db, 'churches', churchId, 'cells', cellId, 'joinRequests', request.uid);
  batch.set(memberRef, {
    uid: request.uid,
    displayName: request.displayName,
    photoURL: request.photoURL || null,
    role: 'member',
    joinedAt: serverTimestamp(),
  });
  batch.update(reqRef, { status: 'approved' });
  batch.update(cellRef, { memberCount: increment(1) });
  await batch.commit();
}

export async function rejectRequest(churchId, cellId, uid) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId, 'joinRequests', uid), { status: 'rejected' });
}

// ---------- 셀원 목록 / 리더 양도 ----------

export function listenMembers(churchId, cellId, callback) {
  const q = query(collection(db, 'churches', churchId, 'cells', cellId, 'members'), orderBy('joinedAt'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// 셀 탈퇴 — 리더가 다른 셀원이 남아있는 채로 나가는 것은 UI에서 막음 (혼자 남은 리더는 바로 나갈 수 있음, 셀은 멤버 0명으로 남음)
export async function leaveCell(churchId, cellId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'churches', churchId, 'cells', cellId, 'members', uid));
  batch.update(doc(db, 'churches', churchId, 'cells', cellId), { memberCount: increment(-1) });
  await batch.commit();
  await updateDoc(doc(db, 'users', uid), { activeCell: null });
}

// 멤버가 0명이 된(리더가 나가버린) 셀을 새로 리더로 등록해서 되살림 — 승인 절차 없이 바로 리더가 됨
export async function claimLeaderlessCell(churchId, cellId, user) {
  const batch = writeBatch(db);
  const cellRef = doc(db, 'churches', churchId, 'cells', cellId);
  const memberRef = doc(db, 'churches', churchId, 'cells', cellId, 'members', user.uid);
  batch.update(cellRef, { leaderUid: user.uid, memberCount: 1 });
  batch.set(memberRef, {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    role: 'leader',
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function transferLeadership(churchId, cellId, currentLeaderUid, newLeaderUid) {
  const batch = writeBatch(db);
  const cellRef = doc(db, 'churches', churchId, 'cells', cellId);
  const oldRef = doc(db, 'churches', churchId, 'cells', cellId, 'members', currentLeaderUid);
  const newRef = doc(db, 'churches', churchId, 'cells', cellId, 'members', newLeaderUid);
  batch.update(cellRef, { leaderUid: newLeaderUid });
  batch.update(oldRef, { role: 'member' });
  batch.update(newRef, { role: 'leader' });
  await batch.commit();
}

// ---------- users/{uid} ----------

export async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName,
      nickname: null,
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      activeCell: null,
      pendingRequest: null,
      leaderNotifiedFor: null,
    });
  }
  return ref;
}

// 닉네임 설정 — 구글 계정 실명 대신 표시할 이름. users/{uid}에 저장하고,
// 현재 속한 셀이 있으면 그 셀의 멤버 문서 displayName도 같이 맞춰줌
export async function setNickname(uid, nickname, activeCell) {
  await updateDoc(doc(db, 'users', uid), { nickname: nickname.trim() });
  if (activeCell) {
    await updateDoc(
      doc(db, 'churches', activeCell.churchId, 'cells', activeCell.cellId, 'members', uid),
      { displayName: nickname.trim() }
    );
  }
}

// 프로필 사진 변경 — users/{uid}에 저장하고, 현재 속한 셀이 있으면 그 셀의 멤버 문서 photoURL도 같이 맞춰줌
export async function setProfilePhoto(uid, photoURL, activeCell) {
  await updateDoc(doc(db, 'users', uid), { photoURL });
  if (activeCell) {
    await updateDoc(
      doc(db, 'churches', activeCell.churchId, 'cells', activeCell.cellId, 'members', uid),
      { photoURL }
    );
  }
}

export async function setPendingRequest(uid, churchId, cellId) {
  await updateDoc(doc(db, 'users', uid), { pendingRequest: { churchId, cellId } });
}

export async function clearPendingRequest(uid) {
  await updateDoc(doc(db, 'users', uid), { pendingRequest: null });
}

// 속해있던 셀이 삭제되는 등으로 사라졌을 때, 화면이 멈춰있지 않고 온보딩으로 돌아가게 함
export async function clearActiveCell(uid) {
  await updateDoc(doc(db, 'users', uid), { activeCell: null });
}

// 이 셀의 리더가 됐다는 알림을 봤다고 표시 (다시 안 뜨게)
export async function markLeaderNotified(uid, churchId, cellId) {
  await updateDoc(doc(db, 'users', uid), { leaderNotifiedFor: { churchId, cellId } });
}

// role은 여기 캐시해두지 않음 — 리더 양도로 바뀔 수 있으므로 항상 members/{uid} 문서에서 실시간으로 읽음 (useMyRole)
export async function setActiveCell(uid, churchId, cellId) {
  await updateDoc(doc(db, 'users', uid), { activeCell: { churchId, cellId }, pendingRequest: null });
}
