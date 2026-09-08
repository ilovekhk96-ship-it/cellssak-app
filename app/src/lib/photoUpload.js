import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

// uid마다 한 장만 유지 — 같은 경로에 새로 올리면 이전 사진은 자동으로 덮어써짐
export async function uploadProfilePhoto(uid, file) {
  const fileRef = ref(storage, `profilePhotos/${uid}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
