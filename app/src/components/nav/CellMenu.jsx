import { useState } from 'react';
import { Users, Pencil, Check } from 'lucide-react';
import { renameCell } from '../../lib/church';
import MemberList from '../members/MemberList';
import AdminApprovals from '../admin/AdminApprovals';

export default function CellMenu({ churchId, cellId, cellName, myUid, isLeader }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('members'); // 'members' | 'admin'
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setNameDraft(cellName);
    setEditingName(true);
  };

  const saveEdit = async () => {
    const name = nameDraft.trim();
    if (!name || name === cellName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await renameCell(churchId, cellId, name);
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  };

  const tabBtnStyle = (key) => ({
    background: tab === key ? '#F5F0E8' : 'transparent',
    color: '#4A3B3F',
  });

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setTab('members');
          setEditingName(false);
        }}
        style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm shrink-0"
      >
        <Users size={13} /> 모임설정
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setOpen(false)} />
          <div
            style={{ background: '#FFFDF9', color: '#4A3B3F', maxHeight: '75vh' }}
            className="relative w-full rounded-3xl shadow-xl flex flex-col overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-center gap-1.5 shrink-0">
              {editingName ? (
                <>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    autoFocus
                    style={{ borderBottom: '1px solid #F0E2E3' }}
                    className="bg-transparent outline-none text-lg text-center py-1 w-40"
                  />
                  <button onClick={saveEdit} disabled={saving || !nameDraft.trim()} style={{ color: '#6FA66B' }} className="disabled:opacity-50">
                    <Check size={18} />
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", fontSize: '1.2rem' }}>{cellName}</span>
                  {isLeader && (
                    <button onClick={startEdit} aria-label="모임 이름 수정" style={{ color: '#9C8286' }}>
                      <Pencil size={13} />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-1 px-5 shrink-0">
              <button onClick={() => setTab('members')} style={tabBtnStyle('members')} className="px-4 py-2 rounded-t-2xl text-sm font-medium">
                셀원
              </button>
              {isLeader && (
                <button onClick={() => setTab('admin')} style={tabBtnStyle('admin')} className="px-4 py-2 rounded-t-2xl text-sm font-medium">
                  가입승인
                </button>
              )}
            </div>

            <div style={{ background: '#F5F0E8' }} className="mx-5 mb-5 rounded-2xl rounded-tl-none flex-1 overflow-y-auto p-4">
              {tab === 'members' ? (
                <MemberList churchId={churchId} cellId={cellId} myUid={myUid} myRole={isLeader ? 'leader' : 'member'} />
              ) : (
                <AdminApprovals churchId={churchId} cellId={cellId} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
