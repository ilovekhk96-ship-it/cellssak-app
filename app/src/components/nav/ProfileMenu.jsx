import { useState } from 'react';
import { Camera, Check, Pencil } from 'lucide-react';
import { setNickname, setProfilePhoto } from '../../lib/church';
import { uploadProfilePhoto } from '../../lib/photoUpload';

export default function ProfileMenu({ user, activeCell, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user.displayName);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  const startEditName = () => {
    setNameDraft(user.displayName);
    setEditingName(true);
  };

  const saveEditName = async () => {
    const name = nameDraft.trim();
    if (!name || name === user.displayName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setNickname(user.uid, name, activeCell);
      setEditingName(false);
    } catch (err) {
      setError('이름 변경에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const photoURL = await uploadProfilePhoto(user.uid, file);
      await setProfilePhoto(user.uid, photoURL, activeCell);
    } catch (err) {
      setError('사진 변경에 실패했어요.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ width: '30px', height: '30px' }}
        className="relative shrink-0 rounded-full overflow-hidden"
        aria-label="프로필"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover block" />
        ) : (
          <div style={{ background: '#FFFDF9' }} className="w-full h-full" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setOpen(false)} />
          <div
            style={{ background: 'var(--paper, #FFF8F0)', color: 'var(--ink, #4A3B3F)' }}
            className="relative w-full rounded-3xl shadow-xl px-5 py-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <label className="relative shrink-0" style={{ width: '52px', height: '52px' }}>
                <div
                  style={{ width: '52px', height: '52px', background: '#F5F0E8' }}
                  className="rounded-full overflow-hidden flex items-center justify-center"
                >
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  )}
                </div>
                <span
                  style={{ background: '#4A3B3F', color: '#FFF8F0', width: '20px', height: '20px' }}
                  className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center shadow-sm"
                >
                  <Camera size={10} />
                </span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
              </label>

              {editingName ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    autoFocus
                    style={{ borderBottom: '1px solid #F0E2E3' }}
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1"
                  />
                  <button
                    onClick={saveEditName}
                    disabled={saving || !nameDraft.trim()}
                    style={{ color: '#6FA66B' }}
                    className="disabled:opacity-50 shrink-0"
                    aria-label="이름 저장"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium truncate">{user.displayName}</span>
                  <button onClick={startEditName} aria-label="이름 수정" style={{ color: '#9C8286' }} className="shrink-0">
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: '#C4456B' }} className="text-xs -mt-2">
                {error}
              </p>
            )}

            <button onClick={onSignOut} style={{ color: '#9C8286' }} className="text-sm text-left py-1">
              로그아웃
            </button>
          </div>
        </div>
      )}
    </>
  );
}
