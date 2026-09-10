import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, Church, Users, Pencil, Check, Crown, ChevronDown, ChevronUp, UserX, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  listAllChurchesWithCells,
  deleteCellCompletely,
  deleteChurchCompletely,
  renameChurch,
  renameCellAsAdmin,
  listMembersForAdmin,
  removeMemberAsAdmin,
  setMemberRoleAsAdmin,
} from '../../lib/superAdmin';

const PAGE_BG = "url('/images/bg-field.jpg') center bottom / cover no-repeat";

export default function SuperAdmin({ onBack }) {
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null); // `church:{id}` | `cell:{churchId}:{cellId}`
  const [nameDraft, setNameDraft] = useState('');
  const [expandedCellKey, setExpandedCellKey] = useState(null);
  const [membersByCell, setMembersByCell] = useState({});
  const [membersLoading, setMembersLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listAllChurchesWithCells();
      setChurches(list);
    } catch (e) {
      setError('목록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEditChurch = (church) => {
    setEditingId(`church:${church.id}`);
    setNameDraft(church.name);
  };

  const startEditCell = (churchId, cell) => {
    setEditingId(`cell:${churchId}:${cell.id}`);
    setNameDraft(cell.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameDraft('');
  };

  const saveEditChurch = async (churchId) => {
    const name = nameDraft.trim();
    if (!name) return;
    setBusyId(`church:${churchId}`);
    try {
      await renameChurch(churchId, name);
      await load();
      setEditingId(null);
    } catch (e) {
      setError('교회 이름 변경에 실패했어요.');
    } finally {
      setBusyId(null);
    }
  };

  const saveEditCell = async (churchId, cellId) => {
    const name = nameDraft.trim();
    if (!name) return;
    setBusyId(`cell:${cellId}`);
    try {
      await renameCellAsAdmin(churchId, cellId, name);
      await load();
      setEditingId(null);
    } catch (e) {
      setError('셀 이름 변경에 실패했어요.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleMembers = async (churchId, cellId) => {
    const key = `${churchId}:${cellId}`;
    if (expandedCellKey === key) {
      setExpandedCellKey(null);
      return;
    }
    setExpandedCellKey(key);
    if (!membersByCell[key]) {
      await refreshMembers(churchId, cellId);
    }
  };

  const refreshMembers = async (churchId, cellId) => {
    const key = `${churchId}:${cellId}`;
    setMembersLoading(true);
    try {
      const members = await listMembersForAdmin(churchId, cellId);
      setMembersByCell((prev) => ({ ...prev, [key]: members }));
    } catch (e) {
      setError('셀원 목록을 불러오지 못했어요.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRemoveMember = async (churchId, cellId, uid) => {
    const key = `removemember:${uid}`;
    if (confirmId !== key) {
      setConfirmId(key);
      return;
    }
    setBusyId(key);
    try {
      await removeMemberAsAdmin(churchId, cellId, uid);
      await refreshMembers(churchId, cellId);
      await load();
    } catch (e) {
      setError('셀원 내보내기에 실패했어요.');
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const handleToggleRole = async (churchId, cellId, member) => {
    const key = `role:${member.id}`;
    setBusyId(key);
    try {
      const nextRole = member.role === 'leader' ? 'member' : 'leader';
      await setMemberRoleAsAdmin(churchId, cellId, member.id, nextRole);
      await refreshMembers(churchId, cellId);
    } catch (e) {
      setError('역할 변경에 실패했어요.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCell = async (churchId, cellId) => {
    const key = `cell:${cellId}`;
    if (confirmId !== key) {
      setConfirmId(key);
      return;
    }
    setBusyId(key);
    try {
      await deleteCellCompletely(churchId, cellId);
      await load();
    } catch (e) {
      setError('셀 삭제에 실패했어요.');
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const handleDeleteChurch = async (churchId) => {
    const key = `church:${churchId}`;
    if (confirmId !== key) {
      setConfirmId(key);
      return;
    }
    setBusyId(key);
    try {
      await deleteChurchCompletely(churchId);
      await load();
    } catch (e) {
      setError('교회 삭제에 실패했어요.');
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <div style={{ background: PAGE_BG }} className="w-full min-h-screen">
      <div className="max-w-sm mx-auto min-h-screen flex flex-col px-5 pt-8 pb-6">
        <button onClick={onBack} style={{ color: '#4A3B3F' }} className="flex items-center gap-1 text-sm mb-4 w-fit">
          <ChevronLeft size={16} /> 돌아가기
        </button>

        <h1 style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", color: '#4A3B3F' }} className="text-2xl mb-1">
          관리자
        </h1>
        <p style={{ color: '#4A3B3F' }} className="text-sm mb-5 opacity-80">
          전체 교회 {churches.length}개
        </p>

        {error && (
          <div style={{ background: '#FDE8ED', color: '#C4456B' }} className="text-xs rounded-xl px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div style={{ background: '#FFFDF9' }} className="rounded-3xl shadow-sm flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
              불러오는 중...
            </p>
          ) : churches.length === 0 ? (
            <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
              등록된 교회가 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {churches.map((church) => {
                const churchKey = `church:${church.id}`;
                const isEditingChurch = editingId === churchKey;
                return (
                  <div key={church.id}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {isEditingChurch ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Church size={14} style={{ color: '#6FA66B' }} className="shrink-0" />
                          <input
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditChurch(church.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            style={{ color: '#4A3B3F', borderBottom: '1px solid #F0E2E3' }}
                            className="bg-transparent outline-none text-sm flex-1 min-w-0"
                          />
                          <button
                            onClick={() => saveEditChurch(church.id)}
                            disabled={busyId === churchKey || !nameDraft.trim()}
                            style={{ color: '#6FA66B' }}
                            className="disabled:opacity-50 shrink-0"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm font-medium min-w-0" style={{ color: '#4A3B3F' }}>
                          <Church size={14} style={{ color: '#6FA66B' }} className="shrink-0" />
                          <span className="truncate">{church.name}</span>
                          <button onClick={() => startEditChurch(church)} className="shrink-0" aria-label="교회 이름 수정">
                            <Pencil size={11} style={{ color: '#9C8286' }} />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteChurch(church.id)}
                        disabled={busyId === churchKey}
                        style={{
                          background: confirmId === churchKey ? '#C4456B' : '#E8DADB',
                          color: confirmId === churchKey ? '#FFF8F0' : '#4A3B3F',
                        }}
                        className="text-xs px-2.5 py-1 rounded-full font-medium disabled:opacity-50 shrink-0 flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        {confirmId === churchKey ? '확정' : '교회 삭제'}
                      </button>
                    </div>

                    {church.cells.length === 0 ? (
                      <p style={{ color: '#9C8286' }} className="text-xs pl-5">
                        셀 없음
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 pl-5">
                        {church.cells.map((cell) => {
                          const cellEditKey = `cell:${church.id}:${cell.id}`;
                          const cellKey = `${church.id}:${cell.id}`;
                          const isEditingCell = editingId === cellEditKey;
                          const isExpanded = expandedCellKey === cellKey;
                          const members = membersByCell[cellKey];
                          return (
                            <div key={cell.id} style={{ background: '#F5F0E8' }} className="rounded-xl px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                {isEditingCell ? (
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <input
                                      value={nameDraft}
                                      onChange={(e) => setNameDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditCell(church.id, cell.id);
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      autoFocus
                                      style={{ color: '#4A3B3F', borderBottom: '1px solid #E8DADB' }}
                                      className="bg-transparent outline-none text-xs flex-1 min-w-0"
                                    />
                                    <button
                                      onClick={() => saveEditCell(church.id, cell.id)}
                                      disabled={busyId === `cell:${cell.id}` || !nameDraft.trim()}
                                      style={{ color: '#6FA66B' }}
                                      className="disabled:opacity-50 shrink-0"
                                    >
                                      <Check size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => toggleMembers(church.id, cell.id)}
                                    className="flex items-center gap-1.5 text-xs min-w-0 flex-1 text-left"
                                    style={{ color: '#4A3B3F' }}
                                  >
                                    <Users size={12} style={{ color: '#F2678A' }} className="shrink-0" />
                                    <span className="truncate">{cell.name}</span>
                                    <span style={{ color: '#9C8286' }} className="shrink-0">
                                      ({cell.memberCount ?? 0}명)
                                    </span>
                                    {isExpanded ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
                                  </button>
                                )}
                                <div className="flex items-center gap-1 shrink-0">
                                  {!isEditingCell && (
                                    <button onClick={() => startEditCell(church.id, cell)} aria-label="셀 이름 수정">
                                      <Pencil size={11} style={{ color: '#9C8286' }} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteCell(church.id, cell.id)}
                                    disabled={busyId === `cell:${cell.id}`}
                                    style={{
                                      background: confirmId === `cell:${cell.id}` ? '#C4456B' : '#E8DADB',
                                      color: confirmId === `cell:${cell.id}` ? '#FFF8F0' : '#4A3B3F',
                                    }}
                                    className="text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50"
                                  >
                                    {confirmId === `cell:${cell.id}` ? '확정' : '삭제'}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: '1px solid #E8DADB' }}>
                                  {membersLoading && !members ? (
                                    <p style={{ color: '#9C8286' }} className="text-xs">
                                      불러오는 중...
                                    </p>
                                  ) : members && members.length === 0 ? (
                                    <p style={{ color: '#9C8286' }} className="text-xs">
                                      셀원 없음
                                    </p>
                                  ) : (
                                    members?.map((m) => {
                                      const removeKey = `removemember:${m.id}`;
                                      const roleKey = `role:${m.id}`;
                                      return (
                                        <div key={m.id} className="flex items-center gap-1.5 text-xs" style={{ color: '#4A3B3F' }}>
                                          {m.photoURL && (
                                            <img src={m.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full shrink-0" />
                                          )}
                                          <span className="truncate flex-1 min-w-0">{m.displayName}</span>
                                          {m.role === 'leader' && <Crown size={11} style={{ color: '#E8A93C' }} className="shrink-0" />}
                                          <button
                                            onClick={() => handleToggleRole(church.id, cell.id, m)}
                                            disabled={busyId === roleKey}
                                            style={{ color: '#7C9EC9' }}
                                            className="shrink-0 disabled:opacity-50"
                                            aria-label={m.role === 'leader' ? '멤버로 변경' : '리더로 지정'}
                                            title={m.role === 'leader' ? '멤버로 변경' : '리더로 지정'}
                                          >
                                            {m.role === 'leader' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                                          </button>
                                          <button
                                            onClick={() => handleRemoveMember(church.id, cell.id, m.id)}
                                            disabled={busyId === removeKey}
                                            style={{ color: confirmId === removeKey ? '#C4456B' : '#9C8286' }}
                                            className="shrink-0 disabled:opacity-50"
                                            aria-label="셀원 내보내기"
                                            title={confirmId === removeKey ? '한 번 더 누르면 내보내져요' : '내보내기'}
                                          >
                                            <UserX size={13} />
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
