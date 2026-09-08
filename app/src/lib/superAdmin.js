import { collection, doc, getDoc, getDocs, deleteDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from './firebase';

// 앱 안에서 아무도 스스로 부여받을 수 없음 — 보안 규칙(firestore.rules)에 이 UID가 직접 고정되어 있어야
// 실제로 삭제 등이 허용됨. 여기 값은 화면 표시 여부만 결정하는 용도.
export const SUPER_ADMIN_UID = 'q0FPoLQkG4ciFKareHsubnEvz712';

export function isSuperAdmin(uid) {
  return uid === SUPER_ADMIN_UID;
}

export async function renameChurch(churchId, name) {
  await updateDoc(doc(db, 'churches', churchId), { name: name.trim() });
}

export async function renameCellAsAdmin(churchId, cellId, name) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId), { name: name.trim() });
}

// 셀원 이름/사진/역할만 — 기도 내용은 안 봄
export async function listMembersForAdmin(churchId, cellId) {
  const snap = await getDocs(collection(db, 'churches', churchId, 'cells', cellId, 'members'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function clearActiveCellForUid(uid, churchId, cellId) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const activeCell = userSnap.exists() ? userSnap.data().activeCell : null;
  if (activeCell && activeCell.churchId === churchId && activeCell.cellId === cellId) {
    await updateDoc(userRef, { activeCell: null });
  }
}

// 셀원 한 명을 그 셀에서 내보냄 (탈퇴 처리) — 그 사람이 지금 이 셀에 들어와 있다면 화면도 자동으로 빠져나가게 함
export async function removeMemberAsAdmin(churchId, cellId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'churches', churchId, 'cells', cellId, 'members', uid));
  batch.update(doc(db, 'churches', churchId, 'cells', cellId), { memberCount: increment(-1) });
  await batch.commit();
  await clearActiveCellForUid(uid, churchId, cellId);
}

// 셀원의 역할(리더/멤버)을 관리자가 직접 바꿈
export async function setMemberRoleAsAdmin(churchId, cellId, uid, role) {
  await updateDoc(doc(db, 'churches', churchId, 'cells', cellId, 'members', uid), { role });
}

export async function listAllChurchesWithCells() {
  const churchesSnap = await getDocs(collection(db, 'churches'));
  const churches = [];
  for (const churchDoc of churchesSnap.docs) {
    const cellsSnap = await getDocs(collection(db, 'churches', churchDoc.id, 'cells'));
    churches.push({
      id: churchDoc.id,
      ...churchDoc.data(),
      cells: cellsSnap.docs.map((c) => ({ id: c.id, ...c.data() })),
    });
  }
  return churches;
}

async function deleteCollectionDocs(colRef) {
  const snap = await getDocs(colRef);
  const docs = snap.docs;
  // Firestore 배치는 최대 500건까지만 되므로 넉넉히 400개씩 끊어서 처리
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// 삭제되는 셀을 "현재 속한 셀"로 갖고 있는 멤버들의 activeCell을 비워서, 그 사람들 화면이
// 사라진 셀에 멈춰있지 않고 다시 교회/셀 선택 화면으로 돌아가게 함
async function clearActiveCellForMembers(churchId, cellId) {
  const membersSnap = await getDocs(collection(db, 'churches', churchId, 'cells', cellId, 'members'));
  for (const memberDoc of membersSnap.docs) {
    const userRef = doc(db, 'users', memberDoc.id);
    const userSnap = await getDoc(userRef);
    const activeCell = userSnap.exists() ? userSnap.data().activeCell : null;
    if (activeCell && activeCell.churchId === churchId && activeCell.cellId === cellId) {
      await updateDoc(userRef, { activeCell: null });
    }
  }
}

// 셀 하나를 하위 데이터(멤버/가입신청/기도데이터)까지 통째로 삭제
export async function deleteCellCompletely(churchId, cellId) {
  const cellPath = ['churches', churchId, 'cells', cellId];
  await clearActiveCellForMembers(churchId, cellId);
  await deleteCollectionDocs(collection(db, ...cellPath, 'members'));
  await deleteCollectionDocs(collection(db, ...cellPath, 'joinRequests'));
  await deleteCollectionDocs(collection(db, ...cellPath, 'entries'));
  await deleteCollectionDocs(collection(db, ...cellPath, 'dailyPrayers'));
  await deleteDoc(doc(db, ...cellPath));
}

// 교회 하나를 그 안의 모든 셀까지 통째로 삭제
export async function deleteChurchCompletely(churchId) {
  const cellsSnap = await getDocs(collection(db, 'churches', churchId, 'cells'));
  for (const cellDoc of cellsSnap.docs) {
    await deleteCellCompletely(churchId, cellDoc.id);
  }
  await deleteDoc(doc(db, 'churches', churchId));
}
