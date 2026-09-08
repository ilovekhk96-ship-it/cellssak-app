import { useState } from 'react';
import { Camera } from 'lucide-react';
import { setNickname, setProfilePhoto } from '../../lib/church';
import { uploadProfilePhoto } from '../../lib/photoUpload';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

export default function ProfileSetup({ user }) {
  const [nickname, setNicknameDraft] = useState('');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      setPhotoURL(url);
    } catch (err) {
      setError('사진을 업로드하지 못했어요. 닉네임만 먼저 설정해도 괜찮아요.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStart = async () => {
    const name = nickname.trim();
    if (!name || saving) return;
    setSaving(true);
    setError('');
    try {
      await setNickname(user.uid, name, null);
      if (photoURL && photoURL !== user.photoURL) {
        await setProfilePhoto(user.uid, photoURL, null);
      }
      // userDoc 실시간 구독이 nickname을 감지하면 자동으로 다음 화면으로 넘어감
    } catch (err) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <div
      style={{ background: PAGE_BG }}
      className="w-full min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
    >
      <h1 style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", color: '#4A3B3F' }} className="text-2xl">
        프로필을 설정해주세요
      </h1>

      <label className="relative shrink-0" style={{ width: '84px', height: '84px' }}>
        <div
          style={{ width: '84px', height: '84px', background: '#FFFDF9' }}
          className="rounded-full overflow-hidden flex items-center justify-center shadow-sm"
        >
          {photoURL ? (
            <img src={photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: '#9C8286' }} className="text-xs">
              사진 추가
            </span>
          )}
        </div>
        <span
          style={{ background: '#4A3B3F', color: '#FFF8F0', width: '26px', height: '26px' }}
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center shadow-md"
        >
          <Camera size={13} />
        </span>
        <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
      </label>

      <input
        value={nickname}
        onChange={(e) => setNicknameDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        placeholder="사용할 닉네임"
        autoFocus
        style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        className="w-full max-w-xs rounded-full px-5 py-3 text-sm text-center outline-none shadow-sm"
      />

      {error && (
        <p style={{ color: '#C4456B' }} className="text-xs -mt-3">
          {error}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={saving || !nickname.trim() || uploadingPhoto}
        style={{ background: '#6FA66B', color: '#FFF8F0' }}
        className="w-full max-w-xs py-3 rounded-full text-sm font-medium disabled:opacity-50"
      >
        시작하기
      </button>
    </div>
  );
}
