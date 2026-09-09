import { useState, useEffect, useRef, useMemo } from 'react';
import { Crown } from 'lucide-react';
import { STATUS, VERSES, FULL_INDEX, getIndexLabel, todayStr } from './data/constants';
import { listenCell, clearActiveCell } from './lib/church';
import {
  listenEntries,
  listenDailyPrayers,
  addEntry,
  updateEntry,
  deleteEntry,
  prayForEntry,
  likeEntry,
  logPrayerForToday,
} from './lib/prayerData';
import TreeScene from './components/TreeScene';
import ListModal from './components/ListModal';
import EntrySheet from './components/EntrySheet';
import ProfileMenu from './components/nav/ProfileMenu';
import CellMenu from './components/nav/CellMenu';
import TreeMoveButton from './components/nav/TreeMoveButton';

export default function App({ user, onSignOut, churchId, cellId, isLeader, onBackHome }) {
  const [cellNameLoaded, setCellNameLoaded] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [cellName, setCellName] = useState('');
  const [entries, setEntries] = useState([]);
  const [dailyPrayers, setDailyPrayers] = useState({}); // { 'YYYY-MM-DD'(KST): string[] (그 날 기도했어요를 누른 사람 이름, 중복 제거) }
  const [openList, setOpenList] = useState(null); // null | 'seed' | 'fruit'
  const [editMode, setEditMode] = useState(false);
  const [sheet, setSheet] = useState(null); // 'add' | { editId, status }
  const [form, setForm] = useState({ prayerName: '', targetName: '', relationship: '', note: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const listRef = useRef(null);
  const groupRefs = useRef({});
  const indexBarRef = useRef(null);

  const loading = !cellNameLoaded || !entriesLoaded;

  useEffect(() => {
    const unsubscribe = listenCell(churchId, cellId, (cell) => {
      if (cell) {
        setCellName(cell.name || '');
        setCellNameLoaded(true);
      } else {
        // 속해있던 셀이 삭제된 경우 — 화면이 멈춰있지 않고 다시 교회/셀 선택으로 돌아가게 함
        clearActiveCell(user.uid);
      }
    });
    return unsubscribe;
  }, [churchId, cellId, user.uid]);

  useEffect(() => {
    setEntriesLoaded(false);
    const unsubEntries = listenEntries(
      churchId,
      cellId,
      (list) => {
        setEntries(list);
        setEntriesLoaded(true);
        setError('');
      },
    );
    const unsubDaily = listenDailyPrayers(churchId, cellId, (map) => setDailyPrayers(map));
    return () => {
      unsubEntries();
      unsubDaily();
    };
  }, [churchId, cellId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = () => {
    setForm({ prayerName: '', targetName: '', relationship: '', note: '' });
    setSheet('add');
  };

  const openEdit = (entry) => {
    setForm({ prayerName: entry.prayerName, targetName: entry.targetName, relationship: entry.relationship, note: entry.note, status: entry.status });
    setSheet({ editId: entry.id, status: entry.status });
    setConfirmDeleteId(null);
  };

  const closeSheet = () => {
    setSheet(null);
    setConfirmDeleteId(null);
  };

  const saveForm = async () => {
    const targetName = form.targetName.trim();
    if (!targetName) return;
    try {
      if (sheet === 'add') {
        await addEntry(churchId, cellId, {
          targetName,
          prayerName: form.prayerName.trim(),
          relationship: form.relationship.trim(),
          note: form.note.trim(),
          status: 'seed',
          prayerCount: 0,
          lastPrayedDate: null,
          likeCount: 0,
          createdAt: Date.now(),
          authorUid: user.uid,
        });
        setToast(`${targetName}님을 기도씨앗에 심었어요 🌱`);
      } else if (sheet && sheet.editId) {
        await updateEntry(churchId, cellId, sheet.editId, {
          targetName,
          prayerName: form.prayerName.trim(),
          relationship: form.relationship.trim(),
          note: form.note.trim(),
          status: form.status,
        });
        setToast(form.status !== sheet.status ? `${STATUS[form.status].label}(으)로 옮겼어요` : '수정했어요');
      }
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    closeSheet();
  };

  const handleDeleteFromSheet = async () => {
    if (!sheet || !sheet.editId) return;
    if (confirmDeleteId !== sheet.editId) {
      setConfirmDeleteId(sheet.editId);
      return;
    }
    try {
      await deleteEntry(churchId, cellId, sheet.editId);
      setToast('삭제했어요');
      setError('');
    } catch (e) {
      setError('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    closeSheet();
  };

  const prayFor = async (id) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    const today = todayStr();
    try {
      await prayForEntry(churchId, cellId, id, today);
      await logPrayerForToday(churchId, cellId, today, target.prayerName.trim());
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const convertToFruit = async (id, name) => {
    try {
      await updateEntry(churchId, cellId, id, { status: 'fruit' });
      setToast(`🎉 ${name}님이 믿음의 열매를 맺었어요!`);
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const likeFor = async (id) => {
    try {
      await likeEntry(churchId, cellId, id);
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const filtered = useMemo(() => entries.filter((e) => e.status === openList), [entries, openList]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const label = getIndexLabel(e.targetName);
      if (!map[label]) map[label] = [];
      map[label].push(e);
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

  const seedCount = entries.filter((e) => e.status === 'seed').length;
  const fruitCount = entries.filter((e) => e.status === 'fruit').length;
  const todayActiveCount = (dailyPrayers[todayStr()] || []).length;

  // 셀원이 '기도했어요'를 처음 누른 날부터 오늘까지, 한국 기준 날짜가 지난 일수
  const daysCount = useMemo(() => {
    const dates = Object.keys(dailyPrayers);
    if (dates.length === 0) return 0;
    const first = dates.sort()[0];
    const today = todayStr();
    const firstDate = new Date(`${first}T00:00:00+09:00`);
    const todayDate = new Date(`${today}T00:00:00+09:00`);
    const diffDays = Math.round((todayDate - firstDate) / 86400000);
    return diffDays + 1;
  }, [dailyPrayers]);

  // 나뭇잎 개수: 매일 그날 '기도했어요'를 누른 사람 수를 누적 합산 (같은 사람이 같은 날 여러 번/여러 대상에 눌러도 하루 1명으로 집계)
  const score = useMemo(
    () => Object.values(dailyPrayers).reduce((sum, names) => sum + names.length, 0),
    [dailyPrayers]
  );

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
        background: 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)',
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
        overflowX: 'hidden',
      }}
      className="w-full min-h-screen"
    >
      <div className="max-w-sm mx-auto min-h-screen relative flex flex-col">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }} className="truncate">
            {cellName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative shrink-0">
              <ProfileMenu user={user} activeCell={{ churchId, cellId }} onSignOut={onSignOut} />
              {isLeader && (
                <span
                  style={{ background: '#E8A93C', color: '#FFF8F0', width: '14px', height: '14px' }}
                  className="absolute -top-1 -right-1 rounded-full flex items-center justify-center shadow-sm"
                >
                  <Crown size={8} />
                </span>
              )}
            </div>
            <CellMenu churchId={churchId} cellId={cellId} cellName={cellName} myUid={user.uid} isLeader={isLeader} />
          </div>
        </div>

        {onBackHome && <TreeMoveButton onClick={onBackHome} label="나의 나무" />}

        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }} className="text-sm py-16 text-center">
            셀싹을 펼치는 중...
          </p>
        ) : (
          <TreeScene
            score={score}
            daysCount={daysCount}
            todayActiveCount={todayActiveCount}
            seedCount={seedCount}
            fruitCount={fruitCount}
            onAdd={openAdd}
            onOpenList={(k) => { setOpenList(k); setEditMode(false); }}
            treeLabel={cellName ? `${cellName}의 기도나무` : ''}
          />
        )}

        {error && (
          <div style={{ background: '#FDE8ED', color: '#C4456B' }} className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto text-xs rounded-xl px-3 py-2 text-center">
            {error}
          </div>
        )}

        {toast && (
          <div style={{ background: 'var(--ink)', color: '#FFF8F0', left: '50%', transform: 'translateX(-50%)' }} className="fixed bottom-6 text-sm px-4 py-2.5 rounded-full shadow-lg">
            {toast}
          </div>
        )}

        {openList && (
          <ListModal
            meta={STATUS[openList]}
            verse={VERSES[openList]}
            entries={filtered}
            grouped={grouped}
            editMode={editMode}
            setEditMode={setEditMode}
            listRef={listRef}
            groupRefs={groupRefs}
            indexBarRef={indexBarRef}
            onIndexPoint={handleIndexPoint}
            onPray={prayFor}
            onConvert={convertToFruit}
            onLike={likeFor}
            myUid={user.uid}
            isLeader={isLeader}
            onEditEntry={openEdit}
            onClose={() => setOpenList(null)}
          />
        )}

        {sheet && (
          <EntrySheet
            mode={sheet === 'add' ? 'add' : 'edit'}
            currentStatus={sheet === 'add' ? 'seed' : sheet.status}
            form={form}
            setForm={setForm}
            onClose={closeSheet}
            onSave={saveForm}
            onDelete={sheet !== 'add' ? handleDeleteFromSheet : null}
            confirmingDelete={sheet !== 'add' && confirmDeleteId === sheet.editId}
          />
        )}
      </div>
    </div>
  );
}
