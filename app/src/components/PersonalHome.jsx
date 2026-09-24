import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Timer, Store } from 'lucide-react';
import { STATUS, VERSES, FULL_INDEX, getIndexLabel, todayStr } from '../data/constants';
import { listenCell } from '../lib/church';
import { shareRequestToCell, logPrayerForToday } from '../lib/prayerData';
import {
  listenPersonalRequests,
  deletePersonalRequestWithUnlink,
  prayForPersonalRequest,
  likePersonalRequest,
  updatePersonalRequestWithSync,
  listenPersonalDailyActivity,
  logPersonalPrayerForToday,
} from '../lib/personalPrayer';
import { personalGoldenIndices } from '../lib/growth';
import TreeScene from './TreeScene';
import TreeSceneV1 from './TreeSceneV1';
import TreeSceneV3 from './TreeSceneV3';
import TreeSceneV4 from './TreeSceneV4';
import TreeSceneV5 from './TreeSceneV5';
import TreeSceneV6 from './TreeSceneV6';
import SceneIcon from './SceneIcon';
import ListModal from './ListModal';
import EntrySheet from './EntrySheet';
import AddEntrySheet from './entry/AddEntrySheet';
import ProfileMenu from './nav/ProfileMenu';
import NotificationBell from './nav/NotificationBell';
import TreeMoveButton from './nav/TreeMoveButton';
import PrayerSession from './prayer/PrayerSession';
import PrayerHeatmap from './prayer/PrayerHeatmap';
import DecorationPicker from './decorations/DecorationPicker';
import { listenEquippedDecorations, setEquippedDecorations } from '../lib/decorations';
import { DECORATIONS, findSlot } from '../data/decorations';

const PAGE_BG = "url('/images/bg-field.jpg') center 72% / cover no-repeat";
const PAGE_BG_V4 = "url('/images/v4-minecraft/bg-field-voxel.png') center 72% / cover no-repeat";
const PAGE_BG_V5 = "url('/images/v5-pixel/bg-field-pixel.png') center 72% / cover no-repeat";
const PAGE_BG_V6 = "url('/images/v6-watercolor/bg-field-watercolor.png') center 72% / cover no-repeat";

export default function PersonalHome({ user, activeCell, pendingRequest, onOpenCellFlow, onSignOut }) {
  const [cellName, setCellName] = useState('');
  const [toast, setToast] = useState('');
  const [requests, setRequests] = useState([]);
  const [dailyActivity, setDailyActivity] = useState({}); // { 'YYYY-MM-DD'(KST): true } — 개인 기도나무 성장 근거
  const [openList, setOpenList] = useState(null); // null | 'seed' | 'fruit'
  const [addOpen, setAddOpen] = useState(false);
  const [sheet, setSheet] = useState(null); // null | { editId, status }
  const [form, setForm] = useState({ prayerName: '', targetName: '', relationship: '', note: '' });
  const [prayerSessionOpen, setPrayerSessionOpen] = useState(false);
  const [prayerHeatmapOpen, setPrayerHeatmapOpen] = useState(false);
  const [decorationPickerOpen, setDecorationPickerOpen] = useState(false);
  const [equippedDecorations, setEquippedDecorationsState] = useState([]);

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
    const unsubscribe = listenEquippedDecorations(user.uid, setEquippedDecorationsState);
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

  // TODO(임시 미리보기용 — 장식 이미지 크기/배치 비교 끝나면 제거): 잎/열매 개수를 직접
  // 눌러서 바꿔보며 비교하기 위한 오버라이드. previewFruit는 null이면 score 기반 자동 계산,
  // 숫자를 누르면 그 값으로 고정(잎 개수랑 별개로 열매 개수만 따로 늘려볼 수 있게)
  const [previewScore, setPreviewScore] = useState(null);
  const [previewFruit, setPreviewFruit] = useState(null);
  // TODO(임시 — 버전3 나무 비교 끝나면 제거): 새 나무 사진(tree2-trunk.png) + 새 잎 시트로
  // 만든 실험용 TreeSceneV3를 켜고 끄면서 기존 나무와 비교해보기 위한 토글
  const [showTreeV3, setShowTreeV3] = useState(false);
  const [showTreeV4, setShowTreeV4] = useState(false);
  const [showTreeV1, setShowTreeV1] = useState(false);
  const [showTreeV5, setShowTreeV5] = useState(false);
  const [showTreeV6, setShowTreeV6] = useState(false);
  const effectiveScore = previewScore ?? score;
  const effectiveFruitCount = previewFruit ?? (previewScore ? Math.round(previewScore / 30) : fruitCount);

  const goldenIndices = useMemo(() => personalGoldenIndices(effectiveScore), [effectiveScore]);

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

  const closeSheet = () => setSheet(null);

  const saveForm = async () => {
    if (!sheet) return;
    const targetName = form.targetName.trim();
    if (!targetName) return;
    try {
      const entry = requests.find((r) => r.id === sheet.editId);
      // 개인 컬렉션은 항상 본인 소유라 기도자 이름은 항상 지금 프로필 이름으로 자동 갱신
      await updatePersonalRequestWithSync(user.uid, entry || { id: sheet.editId }, {
        type: form.type,
        targetName,
        prayerName: user.displayName,
        relationship: form.type === 'intercession' ? form.relationship.trim() : '',
        note: form.note.trim(),
        status: form.status,
      });
      setToast(form.status !== sheet.status ? `${STATUS[form.status].label}(으)로 옮겼어요` : '수정했어요');
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
      // 내 기도나무에서 기도해도 "오늘 기도했다"는 사실은 똑같으니 속한 셀의 나무에도 같이 반영
      if (activeCell) {
        await logPrayerForToday(activeCell.churchId, activeCell.cellId, today, user.uid);
      }
    } catch (e) {
      setToast('저장에 실패했어요.');
    }
  };

  const convertToFruit = async (id) => {
    const entry = requests.find((r) => r.id === id);
    try {
      await updatePersonalRequestWithSync(user.uid, entry || { id }, { status: 'fruit' });
      setToast('🎉 나의 기도가 믿음의 열매를 맺었어요!');
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

  // 장식 장착/해제 — 같은 슬롯(자리)을 쓰는 다른 장식이 이미 있으면 그건 빼고 새 걸로
  // 교체, 이미 장착한 걸 다시 누르면 벗김
  const toggleDecoration = async (deco) => {
    const slot = findSlot(deco.slot);
    const already = equippedDecorations.includes(deco.id);
    let next;
    if (already) {
      next = equippedDecorations.filter((id) => id !== deco.id);
    } else {
      next = equippedDecorations.filter((id) => {
        const other = DECORATIONS.find((d) => d.id === id);
        return !other || other.slot !== slot?.id;
      });
      next = [...next, deco.id];
    }
    setEquippedDecorationsState(next); // 낙관적으로 먼저 반영해서 바로 화면에 보이게
    try {
      await setEquippedDecorations(user.uid, next);
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
        background: showTreeV4 ? PAGE_BG_V4 : showTreeV5 ? PAGE_BG_V5 : showTreeV6 ? PAGE_BG_V6 : PAGE_BG,
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
        overflowX: 'hidden',
      }}
      className="w-full min-h-screen"
    >
      <div className="max-w-sm mx-auto relative flex flex-col" style={{ minHeight: '100dvh' }}>
        <div style={{ position: 'relative', zIndex: 1 }} className="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>셀싹</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDecorationPickerOpen(true)}
              aria-label="나무 장식 상점"
              style={{ background: '#FFFDF9', color: '#B87FC9', width: '30px', height: '30px' }}
              className="flex items-center justify-center rounded-full shadow-sm shrink-0"
            >
              <Store size={14} />
            </button>
            <ProfileMenu user={user} activeCell={activeCell} onSignOut={onSignOut} />
            <NotificationBell activeCell={activeCell} myUid={user.uid} prayedToday={Boolean(dailyActivity[todayStr()])} score={score} />
          </div>
        </div>

        {/* TODO(임시 미리보기용 — 장식 이미지 크기/배치 정할 때만 쓰고 끝나면 제거):
            잎 개수 프리셋 + 열매 개수 직접 조절 */}
        <div
          style={{ maxWidth: '190px', margin: '4px 0 0 8px' }}
          className="flex flex-col gap-1"
        >
          <div className="flex flex-wrap gap-1">
            {[7, 30, 100, 300, 1000, 3000].map((n) => (
              <button
                key={n}
                onClick={() => setPreviewScore(n)}
                style={{
                  background: previewScore === n ? '#6FA66B' : '#FFFDF9',
                  color: previewScore === n ? '#fff' : '#4A3B3F',
                  fontSize: '10px',
                  padding: '3px 6px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                잎{n}
              </button>
            ))}
            <button
              onClick={() => {
                setPreviewScore(null);
                setPreviewFruit(null);
              }}
              style={{ background: '#FFFDF9', color: '#C4456B', fontSize: '10px', padding: '3px 6px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
            >
              원래대로
            </button>
            <button
              onClick={() => { setShowTreeV1((v) => !v); setShowTreeV3(false); setShowTreeV4(false); setShowTreeV5(false); setShowTreeV6(false); }}
              style={{
                background: showTreeV1 ? '#6FA66B' : '#FFFDF9',
                color: showTreeV1 ? '#fff' : '#4A3B3F',
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {showTreeV1 ? '버전1(벡터) 보는중' : '버전1(벡터) 보기'}
            </button>
            <button
              onClick={() => { setShowTreeV3((v) => !v); setShowTreeV1(false); setShowTreeV4(false); setShowTreeV5(false); setShowTreeV6(false); }}
              style={{
                background: showTreeV3 ? '#B87FC9' : '#FFFDF9',
                color: showTreeV3 ? '#fff' : '#4A3B3F',
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {showTreeV3 ? '버전3 보는중' : '버전3 보기'}
            </button>
            <button
              onClick={() => { setShowTreeV4((v) => !v); setShowTreeV1(false); setShowTreeV3(false); setShowTreeV5(false); setShowTreeV6(false); }}
              style={{
                background: showTreeV4 ? '#4A9FD8' : '#FFFDF9',
                color: showTreeV4 ? '#fff' : '#4A3B3F',
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {showTreeV4 ? '버전4(마크) 보는중' : '버전4(마크) 보기'}
            </button>
            <button
              onClick={() => { setShowTreeV5((v) => !v); setShowTreeV1(false); setShowTreeV3(false); setShowTreeV4(false); setShowTreeV6(false); }}
              style={{
                background: showTreeV5 ? '#E0A23D' : '#FFFDF9',
                color: showTreeV5 ? '#fff' : '#4A3B3F',
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {showTreeV5 ? '버전5(픽셀) 보는중' : '버전5(픽셀) 보기'}
            </button>
            <button
              onClick={() => { setShowTreeV6((v) => !v); setShowTreeV1(false); setShowTreeV3(false); setShowTreeV4(false); setShowTreeV5(false); }}
              style={{
                background: showTreeV6 ? '#5B9BD5' : '#FFFDF9',
                color: showTreeV6 ? '#fff' : '#4A3B3F',
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {showTreeV6 ? '버전6(수채화) 보는중' : '버전6(수채화) 보기'}
            </button>
          </div>
          <div className="flex items-center gap-1" style={{ background: '#FFFDF9', borderRadius: '8px', padding: '2px 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', width: 'fit-content' }}>
            <button
              onClick={() => setPreviewFruit((f) => Math.max(0, (f ?? effectiveFruitCount) - 1))}
              style={{ fontSize: '12px', padding: '0 6px', color: '#4A3B3F' }}
            >
              −
            </button>
            <span style={{ fontSize: '10px', color: '#4A3B3F', minWidth: '54px', textAlign: 'center' }}>열매 {effectiveFruitCount}</span>
            <button
              onClick={() => setPreviewFruit((f) => (f ?? effectiveFruitCount) + 1)}
              style={{ fontSize: '12px', padding: '0 6px', color: '#4A3B3F' }}
            >
              +
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }} className="flex flex-col">
          {showTreeV1 ? (
            <TreeSceneV1
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          ) : showTreeV3 ? (
            <TreeSceneV3
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          ) : showTreeV4 ? (
            <TreeSceneV4
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          ) : showTreeV5 ? (
            <TreeSceneV5
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          ) : showTreeV6 ? (
            <TreeSceneV6
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          ) : (
            <TreeScene
              score={effectiveScore}
              daysCount={daysCount}
              todayActiveCount={0}
              seedCount={seedCount}
              fruitCount={effectiveFruitCount}
              showActions={false}
              treeLabel={`${user.displayName}의 기도나무`}
              goldenIndices={goldenIndices}
              equippedDecorations={equippedDecorations}
            />
          )}

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
            <SceneIcon icon={Calendar} label="기도잔디" bg="#FFFDF9" fg="#4A9FD8" onClick={() => setPrayerHeatmapOpen(true)} />
            <SceneIcon icon={Timer} label="기도쌓기" bg="#FFFDF9" fg="#C4456B" onClick={() => setPrayerSessionOpen(true)} />
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

        {prayerSessionOpen && (
          <PrayerSession user={user} activeCell={activeCell} cellName={cellName} onClose={() => setPrayerSessionOpen(false)} />
        )}

        {prayerHeatmapOpen && (
          <PrayerHeatmap user={user} mode="personal" onClose={() => setPrayerHeatmapOpen(false)} />
        )}

        {decorationPickerOpen && (
          <DecorationPicker
            equippedIds={equippedDecorations}
            onToggle={toggleDecoration}
            onClose={() => setDecorationPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
