import { useState, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { todayStr } from '../../data/constants';
import { listenRecentPrayerSessions, sumDurationsByDate, formatDurationKorean } from '../../lib/prayerSessions';
import { listenCellPrayerTimeDaily } from '../../lib/prayerData';

const WEEKS = 53; // 깃허브 잔디처럼 최근 1년치 — 화면보다 넓어서 가로 스크롤로 봄
const CELL = 12; // 칸 크기(px) — 1년치가 들어가야 해서 예전(18px)보다 작게
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 분에 따라 색 농도만 다른 세이지 그린 — 기도쌓기 화면의 진행바 색(#5C7A55)과 같은 계열
function colorForMinutes(minutes) {
  if (minutes <= 0) return '#EDE7DA';
  if (minutes < 15) return '#C9D9C2';
  if (minutes < 30) return '#9DBB90';
  if (minutes < 60) return '#6F9863';
  return '#4F7A45';
}

function shiftDateStr(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function sumRange(byDate, dates) {
  return dates.reduce((sum, d) => sum + (byDate[d] || 0), 0);
}

// 기도잔디 — 하루 총 기도시간(기도쌓기 세션 합)에 따라 색 농도가 달라지는 캘린더.
// mode='personal'(내 나무 화면에서 열림): 본인 기록만, 비교 없음.
// mode='cell'(셀 나무 화면에서 열림): 셀 전체 합계로 칠하고, 셀 합계 vs 내 기여를 항상 같이
// 보여줌 — 다른 셀원 개인별 시간은 여전히 어디에도 없고, "셀 전체" 대 "나" 두 숫자만 비교함
export default function PrayerHeatmap({ user, activeCell, cellName, mode = 'personal', onClose }) {
  const isCellMode = mode === 'cell' && Boolean(activeCell);
  const [sessions, setSessions] = useState([]);
  const [cellDaily, setCellDaily] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const gridScrollRef = useRef(null);

  // 열자마자 최신 주(오늘)가 보이도록 가로 스크롤을 오른쪽 끝으로 — 깃허브 잔디처럼
  // 왼쪽이 과거, 오른쪽이 오늘이라 기본으로 과거부터 보이면 정작 오늘은 스크롤해야 보임
  useEffect(() => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollLeft = gridScrollRef.current.scrollWidth;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = listenRecentPrayerSessions(user.uid, setSessions);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (!isCellMode) {
      setCellDaily({});
      return undefined;
    }
    const unsubscribe = listenCellPrayerTimeDaily(activeCell.churchId, activeCell.cellId, setCellDaily);
    return unsubscribe;
  }, [isCellMode, activeCell?.churchId, activeCell?.cellId]);

  const myByDate = useMemo(() => sumDurationsByDate(sessions), [sessions]);
  const gridByDate = isCellMode ? cellDaily : myByDate;

  const today = todayStr();
  const dates = useMemo(
    () => Array.from({ length: WEEKS * 7 }, (_, i) => shiftDateStr(today, i - (WEEKS * 7 - 1))),
    [today]
  );

  // 첫 주는 일요일부터 시작하도록 앞에 빈 칸을 채움
  const firstDow = new Date(`${dates[0]}T00:00:00Z`).getUTCDay();
  const paddedDates = [...Array(firstDow).fill(null), ...dates];
  const weeks = [];
  for (let i = 0; i < paddedDates.length; i += 7) {
    weeks.push(paddedDates.slice(i, i + 7));
  }

  const totalThisPeriod = sumRange(gridByDate, dates);
  const myTotalThisPeriod = sumRange(myByDate, dates);
  const selectedCellSeconds = selectedDate ? cellDaily[selectedDate] || 0 : 0;
  const selectedMySeconds = selectedDate ? myByDate[selectedDate] || 0 : 0;

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--paper': '#FFFDF9',
    '--font-display': "'Gowun Batang', serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  const title = isCellMode ? `${cellName || '셀'} 잔디` : '기도잔디';

  return (
    <div
      style={{ ...vars, maxWidth: '384px', margin: '0 auto' }}
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
    >
      <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={onClose} />
      <div
        style={{ background: 'var(--paper)', fontFamily: 'var(--font-body)', color: 'var(--ink)', height: '82vh', maxHeight: '640px' }}
        className="relative w-full rounded-3xl shadow-xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ background: '#F5F0E8', color: 'var(--ink)' }}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {isCellMode ? (
            <div style={{ background: '#F5F0E8', borderRadius: '14px' }} className="px-4 py-3 mb-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>최근 1년 · {cellName || '셀'} 전체</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{formatDurationKorean(totalThisPeriod)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>그 중 나</span>
                <span style={{ color: '#5C7A55', fontSize: '0.82rem', fontWeight: 500 }}>{formatDurationKorean(myTotalThisPeriod)}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }} className="mb-4">
              최근 1년 동안 총 {formatDurationKorean(totalThisPeriod)} 기도했어요
            </p>
          )}

          <div className="flex gap-1.5">
            <div className="flex flex-col gap-1 shrink-0" style={{ paddingTop: '2px' }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  style={{ width: `${CELL}px`, height: `${CELL}px`, fontSize: '8px', color: 'var(--ink-soft)' }}
                  className="flex items-center justify-center"
                >
                  {i % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            <div ref={gridScrollRef} className="flex gap-1 overflow-x-auto">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((date, di) =>
                    date ? (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        aria-label={date}
                        style={{
                          width: `${CELL}px`,
                          height: `${CELL}px`,
                          borderRadius: '3px',
                          background: colorForMinutes((gridByDate[date] || 0) / 60),
                          outline: selectedDate === date ? '1.5px solid var(--ink)' : 'none',
                          outlineOffset: '1px',
                        }}
                      />
                    ) : (
                      <div key={`empty-${di}`} style={{ width: `${CELL}px`, height: `${CELL}px` }} />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#F5F0E8', borderRadius: '14px', minHeight: '44px' }} className="mt-5 px-4 py-3">
            {!selectedDate ? (
              <span style={{ fontSize: '0.85rem' }}>날짜를 눌러 확인해보세요</span>
            ) : isCellMode ? (
              <div className="flex flex-col gap-1.5">
                <span style={{ fontSize: '0.85rem' }}>{selectedDate}</span>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{cellName || '셀'} 전체</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{formatDurationKorean(selectedCellSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>그 중 나</span>
                  <span style={{ color: '#5C7A55', fontSize: '0.82rem', fontWeight: 500 }}>
                    {formatDurationKorean(selectedMySeconds)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.85rem' }}>{selectedDate}</span>
                <span style={{ color: '#5C7A55', fontSize: '0.85rem', fontWeight: 500 }}>
                  {formatDurationKorean(myByDate[selectedDate] || 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
