import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { todayStr } from '../../data/constants';
import { listenRecentPrayerSessions, sumDurationsByDate } from '../../lib/prayerSessions';

const WEEKS = 12; // 12주(84일)치만 — 화면 폭에 맞춰 스크롤 없이 한눈에 보이는 정도
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

function formatMinutesLabel(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return '기도 기록 없음';
  return `${minutes}분`;
}

// 기도잔디 — 하루 총 기도시간(기도쌓기 세션 합)에 따라 색 농도가 달라지는 개인 캘린더.
// 지금은 본인 데이터만 보여줌(셀원 전체를 모아 보여주는 히트맵은 개인 기도시간을 셀에
// 공유할지 여부를 먼저 정해야 해서 별도로 다룸)
export default function PrayerHeatmap({ user, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const unsubscribe = listenRecentPrayerSessions(user.uid, setSessions);
    return unsubscribe;
  }, [user.uid]);

  const byDate = useMemo(() => sumDurationsByDate(sessions), [sessions]);

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

  const totalMinutesThisPeriod = Math.round(dates.reduce((sum, d) => sum + (byDate[d] || 0), 0) / 60);
  const selectedSeconds = selectedDate ? byDate[selectedDate] || 0 : null;

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--paper': '#FFFDF9',
    '--font-display': "'Gowun Batang', serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  return (
    <div
      style={{ ...vars, background: 'var(--paper)', fontFamily: 'var(--font-body)', color: 'var(--ink)' }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>기도잔디</span>
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
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }} className="mb-4">
          최근 {WEEKS}주 동안 총 {totalMinutesThisPeriod}분 기도했어요
        </p>

        <div className="flex gap-2">
          <div className="flex flex-col gap-1 shrink-0" style={{ paddingTop: '2px' }}>
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                style={{ width: '18px', height: '18px', fontSize: '9px', color: 'var(--ink-soft)' }}
                className="flex items-center justify-center"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) =>
                  date ? (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      aria-label={date}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: colorForMinutes((byDate[date] || 0) / 60),
                        outline: selectedDate === date ? '1.5px solid var(--ink)' : 'none',
                        outlineOffset: '1px',
                      }}
                    />
                  ) : (
                    <div key={`empty-${di}`} style={{ width: '18px', height: '18px' }} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ background: '#F5F0E8', borderRadius: '14px', minHeight: '44px' }}
          className="mt-5 px-4 py-3 flex items-center justify-between"
        >
          <span style={{ fontSize: '0.85rem' }}>{selectedDate || '날짜를 눌러 확인해보세요'}</span>
          {selectedDate && (
            <span style={{ color: '#5C7A55', fontSize: '0.85rem', fontWeight: 500 }}>
              {formatMinutesLabel(selectedSeconds)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
