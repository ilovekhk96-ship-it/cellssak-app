import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Timer } from 'lucide-react';
import { STATUS, VERSES, FULL_INDEX, getIndexLabel, todayStr } from '../data/constants';
import { listenCell } from '../lib/church';
import { shareRequestToCell } from '../lib/prayerData';
import {
  listenPersonalRequests,
  updatePersonalRequest,
  deletePersonalRequestWithUnlink,
  prayForPersonalRequest,
  likePersonalRequest,
  setPersonalRequestStatus,
  listenPersonalDailyActivity,
  logPersonalPrayerForToday,
} from '../lib/personalPrayer';
import TreeScene from './TreeScene';
import SceneIcon from './SceneIcon';
import ListModal from './ListModal';
import EntrySheet from './EntrySheet';
import AddEntrySheet from './entry/AddEntrySheet';
import ProfileMenu from './nav/ProfileMenu';
import NotificationBell from './nav/NotificationBell';
import TreeMoveButton from './nav/TreeMoveButton';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

export default function PersonalHome({ user, activeCell, pendingRequest, onOpenCellFlow, onSignOut }) {
  const [cellName, setCellName] = useState('');
  const [toast, setToast] = useState('');
  const [requests, setRequests] = useState([]);
  const [dailyActivity, setDailyActivity] = useState({}); // { 'YYYY-MM-DD'(KST): true } — 개인 기도나무 성장 근거
  const [openList, setOpenList] = useState(null); // null | 'seed' | 'fruit'
  const [addOpen, setAddOpen] = useState(false);
  const [sheet, setSheet] = useState(null); // null | { editId, status }
  const [form, setForm] = useState({ prayerName: '', targetName: '', relationship: '', note: '' });

  const listRef = useRef(null);
  const groupRefs = useRef({});
  const indexBarRef = useRef(null);

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
    const unsubscribe = listenPersonalDailyActivity(user.uid, setDailyActivity);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => requests.filter((r) => r.status === openList), [requests, openList]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const label = getIndexLabel(r.targetName);
      if (!map[label]) map[label] = [];
      map[label].push(r);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.targetName.localeCompare(b.targetName, 'ko')));
    return map;
  }, [filtered]);

  const groupsPresent = useMemo(() => new Set(Object.keys(grouped)), [grouped]);

  const scrollToGroup = (label) => {
    const container = listRef.current;
    const el = groupRefs.current[label];
    if (!container || !el) return;
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: Math.max(offset - 4, 0), behavior: 'auto' });
  };

  const handleIndexPoint = (clientY) => {
    const bar = indexBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const relY = clientY - rect.top;
    const itemH = rect.height / FULL_INDEX.length;
    let idx = Math.floor(relY / itemH);
    idx = Math.max(0, Math.min(FULL_INDEX.length - 1, idx));
    const label = FULL_INDEX[idx];
    if (groupsPresent.has(label)) scrollToGroup(label);
  };

  const seedCount = requests.filter((r) => r.status === 'seed').length;
  const fruitCount = requests.filter((r) => r.status === 'fruit').length;

  // 나뭇잎 개수: 기도한 날짜 수를 그대로 누적 (셀 나무와 같은 원리 — 나는 한 명뿐이라 하루 최대 1장)
  const score = useMemo(() => Object.keys(dailyActivity).length, [dailyActivity]);

  // 처음 기도한 날부터 오늘까지, 한국 기준 날짜가 지난 일수 (셀 나무의 daysCount와 동일한 계산)
  const daysCount = useMemo(() => {
    const dates = Object.keys(dailyActivity);
    if (dates.length === 0) return 0;
    const first = dates.sort()[0];
    const today = todayStr();
    const firstDate = new Date(`${first}T00:00:00+09:00`);
    const todayDate = new Date(`${today}T00:00:00+09:00`);
    const diffDays = Math.round((todayDate - firstDate) / 86400000);
    return diffDays + 1;
  }, [dailyActivity]);

  const openEdit = (entry) => {
    setForm({ prayerName: entry.prayerName, targetName: entry.targetName, relationship: entry.relationship, note: entry.note, status: entry.status });
    setSheet({ editId: entry.id, status: entry.status });
  };

  const closeSheet = () => setSheet(null);

  const saveForm = async () => {
    if (!sheet) return;
    const targetName = form.targetName.trim();
    if (!targetName) return;
    try {
      await updatePersonalRequest(user.uid, sheet.editId, {
        targetName,
        prayerName: form.prayerName.trim(),
        relationship: form.relationship.trim(),
        note: form.note.trim(),
      });
      if (form.status !== sheet.status) {
        const entry = requests.find((r) => r.id === sheet.editId);
        await setPersonalRequestStatus(user.uid, entry || { id: sheet.editId }, form.status);
        setToast(`${STATUS[form.status].label}(으)로 옮겼어요`);
      } else {
        setToast('수정했어요');
      }
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
    closeSheet();
  };

  const deleteEntryHandler = async (entry) => {
    try {
      await deletePersonalRequestWithUnlink(user.uid, entry);
      setToast('삭제했어요');
    } catch (e) {
      setToast('삭제에 실패했어요.');
    }
  };

  const shareToCell = async (entry) => {
    if (!activeCell) return;
    try {
      await shareRequestToCell(activeCell.churchId, activeCell.cellId, user.uid, entry);
      setToast(`${cellName || '셀'}에 공유했어요 🌱`);
    } catch (e) {
      setToast('공유에 실패했어요.');
    }
  };

  const prayFor = async (id) => {
    const today = todayStr();
    try {
      await prayForPersonalRequest(user.uid, id, today);
      await logPersonalPrayerForToday(user.uid, today);
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
  };

  const convertToFruit = async (id, name) => {
    const entry = requests.find((r) => r.id === id);
    try {
      await setPersonalRequestStatus(user.uid, entry || { id }, 'fruit');
      setToast(`🎉 ${name}님이 믿음의 열매를 맺었어요!`);
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
  };

  const likeFor = async (id) => {
    try {
      await likePersonalRequest(user.uid, id);
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
            score={score}
            daysCount={daysCount}
            todayActiveCount={0}
            seedCount={0}
            fruitCount={0}
            showActions={false}
            treeLabel={`${user.displayName}의 기도나무`}
            weeklyBonus
          />

          <div style={{ position: 'absolute', left: '14px', bottom: '18px' }} className="flex flex-col items-center gap-2.5">
            <SceneIcon
              icon={STATUS.seed.icon}
              label={STATUS.seed.label}
              count={seedCount}
              bg="#FFFDF9"
              fg={STATUS.seed.color}
              onClick={() => setOpenList('seed')}
            />
            <SceneIcon
              icon={STATUS.fruit.icon}
              label={STATUS.fruit.label}
              count={fruitCount}
              bg="#FFFDF9"
              fg={STATUS.fruit.color}
              onClick={() => setOpenList('fruit')}
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
          <ListModal
            meta={STATUS[openList]}
            verse={VERSES[openList]}
            entries={filtered}
            grouped={grouped}
            listRef={listRef}
            groupRefs={groupRefs}
            indexBarRef={indexBarRef}
            onIndexPoint={handleIndexPoint}
            onPray={prayFor}
            onConvert={convertToFruit}
            onLike={likeFor}
            myUid={user.uid}
            isLeader={false}
            onEditEntry={openEdit}
            onDeleteEntry={deleteEntryHandler}
            onShare={activeCell ? shareToCell : null}
            shareLabel={`${cellName || '모임'}에 공유하기`}
            onClose={() => setOpenList(null)}
            onAdd={openList === 'seed' ? () => setAddOpen(true) : null}
          />
        )}

        {sheet && <EntrySheet form={form} setForm={setForm} onClose={closeSheet} onSave={saveForm} />}

        {addOpen && (
          <AddEntrySheet
            user={user}
            destination={{ kind: 'personal' }}
            onClose={() => setAddOpen(false)}
            onAdded={() => setToast('나의 기도나무에 심었어요 🌱')}
          />
        )}
      </div>
    </div>
  );
}
