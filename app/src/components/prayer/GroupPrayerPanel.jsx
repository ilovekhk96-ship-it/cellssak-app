import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, BookOpen, X } from 'lucide-react';
import {
  listenGroupPrayers,
  createGroupPrayer,
  deleteGroupPrayer,
  groupPrayerPhase,
  toMillis,
} from '../../lib/groupPrayer';

// 함께 기도 약속 목록 — 셀 메뉴의 한 탭. 셀장은 여기서 약속을 만들고, 셀원은 다가오는
// 약속을 본다. 실제로 들어가서 함께 기도하는 화면은 다음 단계(1-B)에서 붙인다.
const MODES = [
  { id: 'self', label: '각자 속도', hint: '같은 시간·같은 말씀, 읽는 속도는 각자' },
  { id: 'leader', label: '인도자 진행', hint: '셀장이 넘기면 모두 화면이 같이 넘어감' },
];

function formatWhen(value) {
  const ms = toMillis(value);
  if (ms == null) return '';
  const d = new Date(ms);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = d.getMinutes();
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]}) ${ampm} ${h12}시${mm ? ` ${mm}분` : ''}`;
}

// datetime-local 입력은 "YYYY-MM-DDTHH:mm" 형식의 지역 시각 문자열을 주고받는다
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultWhen() {
  // 기본값은 "내일 밤 9시" — 매번 날짜부터 고르게 하면 번거로워서
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  return toLocalInputValue(d);
}

export default function GroupPrayerPanel({ churchId, cellId, myUid, isLeader }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(defaultWhen);
  const [mode, setMode] = useState('self');
  const [passages, setPassages] = useState([{ ref: '', text: '' }]);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setLoadError(false);
    const unsubscribe = listenGroupPrayers(
      churchId,
      cellId,
      (list) => {
        setItems(list);
        setLoaded(true);
      },
      () => {
        // 실패해도 로딩 상태는 풀어야 한다 — 안 그러면 "불러오는 중"에서 멈춘 것처럼 보인다
        setLoaded(true);
        setLoadError(true);
      }
    );
    return unsubscribe;
  }, [churchId, cellId]);

  const resetForm = () => {
    setTitle('');
    setWhen(defaultWhen());
    setMode('self');
    setPassages([{ ref: '', text: '' }]);
    setError('');
  };

  const submit = async () => {
    const cleanTitle = title.trim();
    const cleanPassages = passages
      .map((p) => ({ ref: p.ref.trim(), text: p.text.trim() }))
      .filter((p) => p.ref || p.text);
    if (!cleanTitle) {
      setError('약속 이름을 적어주세요.');
      return;
    }
    if (!when) {
      setError('시작 시각을 골라주세요.');
      return;
    }
    if (cleanPassages.length === 0) {
      setError('함께 읽을 말씀을 적어주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createGroupPrayer(churchId, cellId, {
        title: cleanTitle,
        scheduledAt: new Date(when).getTime(),
        passages: cleanPassages,
        mode,
        leaderUid: myUid,
      });
      resetForm();
      setCreating(false);
    } catch (e) {
      setError('약속을 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteGroupPrayer(churchId, cellId, id);
    } catch (e) {
      setError('약속을 지우지 못했어요.');
    }
  };

  const now = Date.now();
  const upcoming = items.filter((gp) => groupPrayerPhase(gp, now) !== 'ended');
  const past = items.filter((gp) => groupPrayerPhase(gp, now) === 'ended').reverse();

  return (
    <div className="flex flex-col gap-3">
      {isLeader && !creating && (
        <button
          onClick={() => setCreating(true)}
          style={{ background: '#FFFDF9', color: '#6FA66B' }}
          className="w-full rounded-2xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Plus size={15} /> 약속 만들기
        </button>
      )}

      {creating && (
        <div style={{ background: '#FFFDF9' }} className="rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">함께 기도 약속</span>
            <button onClick={() => { setCreating(false); resetForm(); }} aria-label="닫기" style={{ color: '#9C8286' }}>
              <X size={16} />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs" style={{ color: '#9C8286' }}>
            약속 이름
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="목요일 밤 함께 기도"
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="rounded-xl px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs" style={{ color: '#9C8286' }}>
            시작 시각
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="rounded-xl px-3 py-2 text-sm"
            />
          </label>

          <div className="flex flex-col gap-1 text-xs" style={{ color: '#9C8286' }}>
            진행 방식
            <div className="flex gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    background: mode === m.id ? '#6FA66B' : '#F5F0E8',
                    color: mode === m.id ? '#FFF8F0' : '#4A3B3F',
                  }}
                  className="flex-1 rounded-xl px-2 py-2 text-xs font-medium"
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] leading-snug">{MODES.find((m) => m.id === mode).hint}</span>
          </div>

          <div className="flex flex-col gap-2 text-xs" style={{ color: '#9C8286' }}>
            함께 읽을 말씀
            {passages.map((p, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex gap-1.5 items-center">
                  <input
                    value={p.ref}
                    onChange={(e) => setPassages(passages.map((x, k) => (k === i ? { ...x, ref: e.target.value } : x)))}
                    placeholder="시편 23:1-3"
                    style={{ background: '#F5F0E8', color: '#4A3B3F' }}
                    className="flex-1 rounded-xl px-3 py-2 text-sm"
                  />
                  {passages.length > 1 && (
                    <button
                      onClick={() => setPassages(passages.filter((_, k) => k !== i))}
                      aria-label="이 말씀 지우기"
                      style={{ color: '#C4456B' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  value={p.text}
                  onChange={(e) => setPassages(passages.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))}
                  placeholder="본문을 붙여넣어 주세요"
                  rows={3}
                  style={{ background: '#F5F0E8', color: '#4A3B3F' }}
                  className="rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>
            ))}
            {/* 여러 장으로 나누면 인도자 진행일 때 한 장씩 넘길 수 있다 */}
            <button
              onClick={() => setPassages([...passages, { ref: '', text: '' }])}
              style={{ color: '#6FA66B' }}
              className="self-start text-xs flex items-center gap-1"
            >
              <Plus size={13} /> 말씀 더 넣기
            </button>
          </div>

          {error && <p style={{ color: '#C4456B' }} className="text-xs">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            style={{ background: '#6FA66B', color: '#FFF8F0' }}
            className="rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? '만드는 중…' : '약속 만들기'}
          </button>
        </div>
      )}

      {!loaded && (
        <p style={{ color: '#9C8286' }} className="text-sm text-center py-6">불러오는 중…</p>
      )}

      {loaded && loadError && (
        <p style={{ color: '#C4456B' }} className="text-sm text-center py-6 leading-relaxed">
          약속 목록을 불러오지 못했어요.
          <br />
          연결을 확인하고 다시 열어주세요.
        </p>
      )}

      {loaded && !loadError && upcoming.length === 0 && past.length === 0 && !creating && (
        <p style={{ color: '#9C8286' }} className="text-sm text-center py-6 leading-relaxed whitespace-pre-line">
          {isLeader
            ? '아직 함께 기도 약속이 없어요.'
            : '아직 함께 기도 약속이 없어요.\n셀장이 약속을 만들면 여기에 보여요.'}
        </p>
      )}

      {upcoming.map((gp) => {
        const phase = groupPrayerPhase(gp, now);
        return (
          <div key={gp.id} style={{ background: '#FFFDF9' }} className="rounded-2xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-bold leading-snug">{gp.title}</span>
              {isLeader && (
                <button onClick={() => remove(gp.id)} aria-label="약속 지우기" style={{ color: '#C4456B' }} className="shrink-0">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <span style={{ color: '#9C8286' }} className="text-xs flex items-center gap-1">
              <Clock size={12} /> {formatWhen(gp.scheduledAt)}
            </span>
            <span style={{ color: '#9C8286' }} className="text-xs flex items-center gap-1">
              <BookOpen size={12} /> {gp.passages?.map((p) => p.ref).filter(Boolean).join(' · ') || '말씀'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                style={{ background: '#F5F0E8', color: '#4A3B3F' }}
                className="text-[11px] rounded-full px-2 py-0.5"
              >
                {MODES.find((m) => m.id === gp.mode)?.label || '각자 속도'}
              </span>
              {phase === 'open' && (
                <span style={{ background: '#6FA66B', color: '#FFF8F0' }} className="text-[11px] rounded-full px-2 py-0.5">
                  지금 열려 있어요
                </span>
              )}
            </div>
          </div>
        );
      })}

      {past.length > 0 && (
        <>
          <span style={{ color: '#9C8286' }} className="text-xs mt-1">지난 약속</span>
          {past.map((gp) => (
            <div key={gp.id} style={{ background: '#FFFDF9', opacity: 0.6 }} className="rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm">{gp.title}</span>
                <span style={{ color: '#9C8286' }} className="text-xs">{formatWhen(gp.scheduledAt)}</span>
              </div>
              {isLeader && (
                <button onClick={() => remove(gp.id)} aria-label="약속 지우기" style={{ color: '#C4456B' }} className="shrink-0">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
