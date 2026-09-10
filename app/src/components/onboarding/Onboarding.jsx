import { useState, useEffect } from 'react';
import { Church, Users, Plus, ChevronLeft } from 'lucide-react';
import {
  listChurches,
  createChurch,
  listCells,
  createCell,
  submitJoinRequest,
  setPendingRequest,
  setActiveCell,
  claimLeaderlessCell,
  markLeaderNotified,
} from '../../lib/church';

const PAGE_BG = "url('/images/bg-field.jpg') center 72% / cover no-repeat";

export default function Onboarding({ user, onBackHome }) {
  const [step, setStep] = useState('church'); // 'church' | 'cell'
  const [churches, setChurches] = useState([]);
  const [cells, setCells] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newChurchName, setNewChurchName] = useState('');
  const [newCellName, setNewCellName] = useState('');
  const [showNewChurch, setShowNewChurch] = useState(false);
  const [showNewCell, setShowNewCell] = useState(false);

  useEffect(() => {
    setLoading(true);
    listChurches()
      .then(setChurches)
      .catch(() => setError('교회 목록을 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, []);

  const openChurch = async (church) => {
    setSelectedChurch(church);
    setStep('cell');
    setLoading(true);
    setError('');
    try {
      const list = await listCells(church.id);
      setCells(list);
    } catch (e) {
      setError('셀 목록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  const backToChurch = () => {
    setStep('church');
    setSelectedChurch(null);
    setCells([]);
    setShowNewCell(false);
  };

  const handleCreateChurch = async () => {
    const name = newChurchName.trim();
    if (!name || busy) return;
    setBusy(true);
    setError('');
    try {
      const churchId = await createChurch(name, user.uid);
      const church = { id: churchId, name };
      setChurches((prev) => [...prev, church].sort((a, b) => a.name.localeCompare(b.name, 'ko')));
      setNewChurchName('');
      setShowNewChurch(false);
      await openChurch(church);
    } catch (e) {
      setError('교회를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateCell = async () => {
    const name = newCellName.trim();
    if (!name || busy || !selectedChurch) return;
    setBusy(true);
    setError('');
    try {
      const cellId = await createCell(selectedChurch.id, name, user);
      await setActiveCell(user.uid, selectedChurch.id, cellId);
      await markLeaderNotified(user.uid, selectedChurch.id, cellId); // 직접 만든 셀이라 "리더가 됐어요" 안내는 생략
      // activeCell이 설정되면 useMembership 구독으로 자동으로 메인 화면으로 넘어감
    } catch (e) {
      setError('셀을 만들지 못했어요. 잠시 후 다시 시도해주세요.');
      setBusy(false);
    }
  };

  const handleJoinCell = async (cell) => {
    if (busy || !selectedChurch) return;
    setBusy(true);
    setError('');
    try {
      await submitJoinRequest(selectedChurch.id, cell.id, user);
      await setPendingRequest(user.uid, selectedChurch.id, cell.id);
      // pendingRequest가 설정되면 useMembership 구독으로 자동으로 대기 화면으로 넘어감
    } catch (e) {
      setError('가입 신청에 실패했어요. 잠시 후 다시 시도해주세요.');
      setBusy(false);
    }
  };

  // 리더가 나가서 멤버가 0명이 된 셀은 승인 절차 없이 바로 리더로 들어갈 수 있음
  const handleClaimCell = async (cell) => {
    if (busy || !selectedChurch) return;
    setBusy(true);
    setError('');
    try {
      await claimLeaderlessCell(selectedChurch.id, cell.id, user);
      await setActiveCell(user.uid, selectedChurch.id, cell.id);
      await markLeaderNotified(user.uid, selectedChurch.id, cell.id); // 직접 되살린 셀이라 안내 생략
    } catch (e) {
      setError('셀을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setBusy(false);
    }
  };

  return (
    <div style={{ background: PAGE_BG }} className="w-full min-h-screen">
      <div className="max-w-sm mx-auto min-h-screen flex flex-col px-5 pt-8 pb-6">
        {onBackHome && (
          <button
            onClick={onBackHome}
            style={{ color: '#4A3B3F' }}
            className="flex items-center gap-1 text-xs mb-2 w-fit opacity-70"
          >
            <ChevronLeft size={14} /> 내 기도나무
          </button>
        )}
        <h1
          style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", color: '#4A3B3F' }}
          className="text-3xl mb-1"
        >
          셀싹
        </h1>
        <p style={{ color: '#4A3B3F' }} className="text-sm mb-6">
          {step === 'church' ? '소속된 교회를 찾아주세요' : `${selectedChurch?.name} · 셀을 찾아주세요`}
        </p>

        {step === 'cell' && (
          <button
            onClick={backToChurch}
            style={{ color: '#4A3B3F' }}
            className="flex items-center gap-1 text-sm mb-3 w-fit"
          >
            <ChevronLeft size={16} /> 교회 다시 선택
          </button>
        )}

        {error && (
          <div style={{ background: '#FDE8ED', color: '#C4456B' }} className="text-xs rounded-xl px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div style={{ background: '#FFFDF9' }} className="rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
                불러오는 중...
              </p>
            ) : step === 'church' ? (
              <ChurchList churches={churches} onSelect={openChurch} />
            ) : (
              <CellList cells={cells} onJoin={handleJoinCell} onClaim={handleClaimCell} busy={busy} />
            )}
          </div>

          <div className="border-t px-4 py-3" style={{ borderColor: 'var(--line, #F0E2E3)' }}>
            {step === 'church' ? (
              <CreateRow
                label="새 교회 만들기"
                open={showNewChurch}
                setOpen={setShowNewChurch}
                value={newChurchName}
                setValue={setNewChurchName}
                placeholder="교회 이름"
                onSubmit={handleCreateChurch}
                busy={busy}
              />
            ) : (
              <CreateRow
                label="새 셀 만들기 (내가 리더가 돼요)"
                open={showNewCell}
                setOpen={setShowNewCell}
                value={newCellName}
                setValue={setNewCellName}
                placeholder="셀 이름"
                onSubmit={handleCreateCell}
                busy={busy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChurchList({ churches, onSelect }) {
  if (churches.length === 0) {
    return (
      <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
        아직 등록된 교회가 없어요.
        <br />
        아래에서 새로 만들어주세요.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {churches.map((church) => (
        <button
          key={church.id}
          onClick={() => onSelect(church)}
          style={{ background: '#F5F0E8', color: '#4A3B3F' }}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left text-sm font-medium active:scale-[0.98] transition-transform"
        >
          <Church size={16} style={{ color: '#6FA66B' }} />
          {church.name}
        </button>
      ))}
    </div>
  );
}

function CellList({ cells, onJoin, onClaim, busy }) {
  if (cells.length === 0) {
    return (
      <p style={{ color: '#9C8286' }} className="text-sm text-center py-10">
        아직 등록된 셀이 없어요.
        <br />
        아래에서 새로 만들어주세요.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {cells.map((cell) => {
        const isEmpty = !cell.memberCount || cell.memberCount <= 0;
        return (
          <div
            key={cell.id}
            style={{ background: '#F5F0E8' }}
            className="flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium min-w-0" style={{ color: '#4A3B3F' }}>
              <Users size={16} style={{ color: '#F2678A' }} className="shrink-0" />
              <span className="truncate">{cell.name}</span>
              {isEmpty && (
                <span style={{ color: '#9C8286' }} className="text-xs shrink-0">
                  (셀원 없음)
                </span>
              )}
            </span>
            {isEmpty ? (
              <button
                onClick={() => onClaim(cell)}
                disabled={busy}
                style={{ background: '#E8A93C', color: '#FFF8F0' }}
                className="text-xs px-3 py-1.5 rounded-full font-medium disabled:opacity-50 shrink-0"
              >
                리더 되기
              </button>
            ) : (
              <button
                onClick={() => onJoin(cell)}
                disabled={busy}
                style={{ background: '#6FA66B', color: '#FFF8F0' }}
                className="text-xs px-3 py-1.5 rounded-full font-medium disabled:opacity-50 shrink-0"
              >
                가입 신청
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CreateRow({ label, open, setOpen, value, setValue, placeholder, onSubmit, busy }) {
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ color: '#6FA66B' }}
        className="flex items-center gap-1.5 text-sm font-medium w-full justify-center py-1"
      >
        <Plus size={16} /> {label}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{ borderBottom: '1px solid #F0E2E3', color: '#4A3B3F' }}
        className="flex-1 bg-transparent outline-none text-sm py-1.5"
      />
      <button
        onClick={onSubmit}
        disabled={busy || !value.trim()}
        style={{ background: '#6FA66B', color: '#FFF8F0' }}
        className="text-xs px-3 py-1.5 rounded-full font-medium disabled:opacity-50 shrink-0"
      >
        만들기
      </button>
    </div>
  );
}
