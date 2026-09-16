import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// 장착한 장식품 id 목록 — 개인 나무 전용 커스터마이징이라 기존 users/{uid} 문서 필드로
// 저장(본인만 쓸 수 있는 권한이 이미 있어서 규칙을 새로 안 만들어도 됨)
export function listenEquippedDecorations(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.data()?.equippedDecorations || []);
  });
}

export async function setEquippedDecorations(uid, decorationIds) {
  await updateDoc(doc(db, 'users', uid), { equippedDecorations: decorationIds });
}
