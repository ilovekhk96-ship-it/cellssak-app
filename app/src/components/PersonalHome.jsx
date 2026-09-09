import { useState, useEffect, useMemo } from 'react';
import { Calendar, Timer } from 'lucide-react';
import { STATUS } from '../data/constants';
import { listenCell } from '../lib/church';
import { listenPersonalRequests, updatePersonalRequest, deletePersonalRequest } from '../lib/personalPrayer';
import TreeScene from './TreeScene';
import SceneIcon from './SceneIcon';
import PersonalListModal from './PersonalListModal';
import PersonalEntrySheet from './PersonalEntrySheet';
import AddEntrySheet from './entry/AddEntrySheet';
import ProfileMenu from './nav/ProfileMenu';
import NotificationBell from './nav/NotificationBell';
import TreeMoveButton from './nav/TreeMoveButton';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

export default function PersonalHome({ user, activeCell, pendingRequest, onOpenCellFlow, onSignOut }) {
  const [cellName, setCellName] = useState('');
  const [toast, setToast] = useState('');
  const [requests, setRequests] = useState([]);
  const [openList, setOpenList] = useState(null); // null | 'seed' | 'fruit'
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sheet, setSheet] = useState(null); // null | { editId, status }
  const [form, setForm] = useState({ content: '', status: 'seed' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!activeCell) {
      setCellName('');
      return;
    }
    const unsubscribe = listenCell(activeCell.churchId, activeCell.cellId, (cell) => {
      setCellName(cell?.name || '');
    });
    return unsubscribe;
  }, [activeCell?.churchId, activeCell?.cellId]);

  useEffect(() => {
    const unsubscribe = listenPersonalRequests(user.uid, setRequests);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => requests.filter((r) => r.status === openList), [requests, openList]);
  const seedCount = requests.filter((r) => r.status === 'seed').length;
  const fruitCount = requests.filter((r) => r.status === 'fruit').length;

  const openEdit = (entry) => {
    setForm({ content: entry.content, status: entry.status });
    setSheet({ editId: entry.id, status: entry.status });
    setConfirmDeleteId(null);
  };

  const closeSheet = () => {
    setSheet(null);
    setConfirmDeleteId(null);
  };

  const saveForm = async () => {
    if (!sheet) return;
    const content = form.content.trim();
    if (!content) return;
    try {
      await updatePersonalRequest(user.uid, sheet.editId, { content, status: form.status });
      setToast(form.status !== sheet.status ? `${STATUS[form.status].label}(으)로 옮겼어요` : '수정했어요');
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
    closeSheet();
  };

  const handleDeleteFromSheet = async () => {
    if (!sheet) return;
    if (confirmDeleteId !== sheet.editId) {
      setConfirmDeleteId(sheet.editId);
      return;
    }
    try {
      await deletePersonalRequest(user.uid, sheet.editId);
      setToast('삭제했어요');
    } catch (e) {
      setToast('삭제에 실패했어요.');
    }
    closeSheet();
  };

  const convertToFruit = async (id) => {
    try {
      await updatePersonalRequest(user.uid, id, { status: 'fruit' });
      setToast('🎉 믿음의 열매를 맺었어요!');
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
  };

  const moveLine = activeCell
    ? cellName
      ? { top: cellName, bottom: '나무' }
      : { top: '모임', bottom: '나무' }
    : pendingRequest
    ? { top: '승인', bottom: '대기중' }
    : { top: '모임', bottom: '선택' };

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--line': '#F0E2E3',
    '--paper': '#FFF8F0',
    '--font-display': "'Cafe24Dongdong', 'Gowun Dodum', sans-serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  return (
    <div
      style={{
        ...vars,
        background: PAGE_BG,
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
        overflowX: 'hidden',
      }}
      className="w-full min-h-screen"
    >
      <div className="max-w-sm mx-auto min-h-screen relative flex flex-col">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>셀싹</span>
          <div className="flex items-center gap-2 shrink-0">
            <ProfileMenu user={user} activeCell={activeCell} onSignOut={onSignOut} />
            <NotificationBell />
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }} className="flex flex-col">
          <TreeScene
            score={0}
            daysCount={0}
            todayActiveCount={0}
            seedCount={0}
            fruitCount={0}
            showActions={false}
            treeLabel={`${user.displayName}의 기도나무`}
          />

          <div style={{ position: 'absolute', left: '14px', bottom: '18px' }} className="flex flex-col items-center gap-2.5">
            <SceneIcon
              icon={STATUS.seed.icon}
              label={STATUS.seed.label}
              count={seedCount}
              bg="#FFFDF9"
              fg={STATUS.seed.color}
              onClick={() => {
                setOpenList('seed');
                setEditMode(false);
              }}
            />
            <SceneIcon
              icon={STATUS.fruit.icon}
              label={STATUS.fruit.label}
              count={fruitCount}
              bg="#FFFDF9"
              fg={STATUS.fruit.color}
              onClick={() => {
                setOpenList('fruit');
                setEditMode(false);
              }}
            />
            <SceneIcon icon={Calendar} label="캘린더" bg="#FFFDF9" fg="#4A9FD8" onClick={() => setToast('준비 중이에요')} />
            <SceneIcon icon={Timer} label="타이머" bg="#FFFDF9" fg="#C4456B" onClick={() => setToast('준비 중이에요')} />
          </div>
        </div>

        <TreeMoveButton onClick={onOpenCellFlow} lineTop={moveLine.top} lineBottom={moveLine.bottom} />

        {toast && (
          <div
            style={{ background: 'var(--ink)', color: '#FFF8F0', left: '50%', transform: 'translateX(-50%)' }}
            className="fixed bottom-24 text-sm px-4 py-2.5 rounded-full shadow-lg"
          >
            {toast}
          </div>
        )}

        {openList && (
          <PersonalListModal
            meta={STATUS[openList]}
            entries={filtered}
            editMode={editMode}
            setEditMode={setEditMode}
            onConvert={convertToFruit}
            onEditEntry={openEdit}
            onClose={() => setOpenList(null)}
            onAdd={openList === 'seed' ? () => setAddOpen(true) : null}
          />
        )}

        {sheet && (
          <PersonalEntrySheet
            form={form}
            setForm={setForm}
            onClose={closeSheet}
            onSave={saveForm}
            onDelete={handleDeleteFromSheet}
            confirmingDelete={confirmDeleteId === sheet.editId}
          />
        )}

        {addOpen && (
          <AddEntrySheet
            user={user}
            activeCell={activeCell}
            defaultType="mine"
            onClose={() => setAddOpen(false)}
            onAdded={(kind, name) =>
              setToast(kind === 'mine' ? '나의 기도에 심었어요 🌱' : `${name}님을 ${cellName || '셀'}에 기도씨앗으로 심었어요 🌱`)
            }
          />
        )}
      </div>
    </div>
  );
}
