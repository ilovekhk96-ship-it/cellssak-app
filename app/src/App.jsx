import { useState, useEffect, useRef, useMemo } from 'react';
import { Crown } from 'lucide-react';
import { STATUS, VERSES, FULL_INDEX, getIndexLabel, todayStr } from './data/constants';
import { listenCell, clearActiveCell } from './lib/church';
import {
  listenEntries,
  listenDailyPrayers,
  deleteEntryWithUnlink,
  prayForEntry,
  likeEntry,
  logPrayerForToday,
  updateEntryWithSync,
  logFruitActivity,
} from './lib/prayerData';
import { copyEntryToPersonal, logPersonalPrayerForToday } from './lib/personalPrayer';
import { myWeeklyGoldenIndicesInCell } from './lib/growth';
import TreeScene from './components/TreeScene';
import ListModal from './components/ListModal';
import EntrySheet from './components/EntrySheet';
import AddEntrySheet from './components/entry/AddEntrySheet';
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
  const [dailyPrayers, setDailyPrayers] = useState({}); // { 'YYYY-MM-DD'(KST): string[] (그 날 기도했어요를 누른 사람의 uid, 중복 제거) }
  const [openList, setOpenList] = useState(null); // null | 'seed' | 'fruit'
  const [addOpen, setAddOpen] = useState(false);
  const [sheet, setSheet] = useState(null); // null | { editId, status }
  const [form, setForm] = useState({ prayerName: '', targetName: '', relationship: '', note: '' });

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

  const openEdit = (entry) => {
    setForm({
      type: entry.type || 'intercession',
      prayerName: entry.prayerName,
      targetName: entry.targetName,
      relationship: entry.relationship,
      note: entry.note,
      status: entry.status,
    });
    setSheet({ editId: entry.id, status: entry.status });
  };

  const closeSheet = () => {
    setSheet(null);
  };

  const saveForm = async () => {
    if (!sheet) return;
    const targetName = form.targetName.trim();
    if (!targetName) return;
    const entry = entries.find((e) => e.id === sheet.editId);
    // 기도자 이름은 더 이상 직접 입력받지 않고 프로필과 연동 — 본인 항목을 수정할 때는 지금
    // 프로필 이름으로 자동 갱신하고, 리더가 남의 항목을 수정할 때는 원래 기도자 이름을 그대로 둠
    const isMine = !entry || entry.authorUid === user.uid;
    try {
      await updateEntryWithSync(
        churchId,
        cellId,
        entry || { id: sheet.editId },
        {
          type: form.type,
          targetName,
          prayerName: isMine ? user.displayName : form.prayerName,
          relationship: form.type === 'intercession' ? form.relationship.trim() : '',
          note: form.note.trim(),
          status: form.status,
        },
        user.uid
      );
      setToast(form.status !== sheet.status ? `${STATUS[form.status].label}(으)로 옮겼어요` : '수정했어요');
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    closeSheet();
  };

  const deleteEntryHandler = async (entry) => {
    try {
      await deleteEntryWithUnlink(churchId, cellId, entry, user.uid);
      setToast('삭제했어요');
      setError('');
    } catch (e) {
      setError('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const shareToPersonal = async (entry) => {
    try {
      await copyEntryToPersonal(user.uid, churchId, cellId, entry);
      setToast('내 기도나무로 복사했어요 🌱');
    } catch (e) {
      setError('복사에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const prayFor = async (id) => {
    const today = todayStr();
    try {
      await prayForEntry(churchId, cellId, id, today);
      // 오늘 기도한 사람 수는 "이 항목의 기도자로 지정된 이름"이 아니라 실제로 버튼을 누른 나 자신으로 집계
      await logPrayerForToday(churchId, cellId, today, user.uid);
      // 셀에서 기도해도 "오늘 기도했다"는 사실은 똑같으니 내 개인 기도나무에도 같이 반영
      await logPersonalPrayerForToday(user.uid, today);
      setError('');
    } catch (e) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const convertToFruit = async (id) => {
    const entry = entries.find((e) => e.id === id);
    const isMine = !entry || entry.authorUid === user.uid;
    try {
      await updateEntryWithSync(churchId, cellId, entry || { id }, { status: 'fruit' }, user.uid);
      if (entry) {
        // 다른 셀원의 알림 목록에 뜨도록 활동 기록을 남김 (본인 것도 남기지만, 알림에서
        // 본인이 한 행동은 걸러서 안 보여줌 — 이미 이 토스트로 확인했으니까)
        await logFruitActivity(churchId, cellId, {
          targetName: entry.targetName,
          prayerName: entry.prayerName,
          actorUid: user.uid,
          entryType: entry.type || 'intercession',
        });
      }
      setToast(isMine ? '🎉 나의 기도가 믿음의 열매를 맺었어요!' : `🎉 ${entry.prayerName}님의 기도가 믿음의 열매를 맺었어요!`);
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

  // 황금 잎: 셀 전체 잎 개수가 아니라 "내가 이 셀에서 7번째로 활동한 날"에 내가 기여한 잎만
  const goldenIndices = useMemo(() => myWeeklyGoldenIndicesInCell(dailyPrayers, user.uid), [dailyPrayers, user.uid]);

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
        background: "url('/images/bg-field.jpg') center bottom / cover no-repeat",
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

        {onBackHome && <TreeMoveButton onClick={onBackHome} lineTop="나의" lineBottom="나무" />}

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
            onOpenList={(k) => setOpenList(k)}
            treeLabel={cellName ? `${cellName}의 기도나무` : ''}
            goldenIndices={goldenIndices}
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
            onDeleteEntry={deleteEntryHandler}
            onShare={shareToPersonal}
            shareLabel="내 나무로 복사하기"
            onClose={() => setOpenList(null)}
            onAdd={openList === 'seed' ? () => setAddOpen(true) : null}
          />
        )}

        {sheet && <EntrySheet form={form} setForm={setForm} onClose={closeSheet} onSave={saveForm} />}

        {addOpen && (
          <AddEntrySheet
            user={user}
            destination={{ kind: 'cell', churchId, cellId }}
            onClose={() => setAddOpen(false)}
            onAdded={() => setToast('기도씨앗을 심었어요 🌱')}
          />
        )}
      </div>
    </div>
  );
}
