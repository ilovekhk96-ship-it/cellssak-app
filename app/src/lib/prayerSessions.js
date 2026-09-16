import { collection, doc, setDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logPersonalPrayerForToday } from './personalPrayer';
import { logPrayerForToday, incrementCellPrayerTime } from './prayerData';

// 기도쌓기(스톱워치) 세션 기록 — 나무 성장 근거(dailyActivity)와는 별개 컬렉션.
// dailyActivity는 "그날 기도했는지"만 알면 되지만, 오늘/일별/주간 기도시간이나 기도잔디
// 색 농도(하루 총 기도시간)를 보여주려면 세션별 경과시간이 따로 쌓여 있어야 해서 분리함.
function sessionsCol(uid) {
  return collection(db, 'users', uid, 'prayerSessions');
}

// 세션 종료 시 한 번 호출 — durationSeconds가 너무 짧으면(실수로 시작/종료 눌렀을 때)
// 기록도 나무 성장 반영도 하지 않음
const MIN_DURATION_SECONDS = 5;

export async function savePrayerSession({ uid, activeCell, startedAt, endedAt, durationSeconds, date }) {
  if (durationSeconds < MIN_DURATION_SECONDS) return { saved: false };

  const ref = doc(sessionsCol(uid));
  await setDoc(ref, {
    startedAt,
    endedAt,
    durationSeconds: Math.round(durationSeconds),
    date, // KST 'YYYY-MM-DD' — 일별/기도잔디 집계용
    createdAt: serverTimestamp(),
  });

  // 기존 "기도했어요" 흐름과 동일하게 오늘 기도 활동을 남겨 개인 나무(+ 속한 셀 나무)가 그대로 자람
  await logPersonalPrayerForToday(uid, date);
  if (activeCell) {
    await logPrayerForToday(activeCell.churchId, activeCell.cellId, date, uid);
    // 개인별 시간은 셀에 전혀 남기지 않고, 그날 셀 전체 합계에만 이번 세션 시간을 더함
    await incrementCellPrayerTime(activeCell.churchId, activeCell.cellId, date, durationSeconds);
  }

  return { saved: true };
}

// 최근 세션 목록(오늘 기도시간, 기도잔디 등 합산용) — 넉넉히 최근 400건만 구독
export function listenRecentPrayerSessions(uid, callback) {
  const q = query(sessionsCol(uid), orderBy('date', 'desc'), limit(400));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// 세션 목록을 날짜별 총 경과초로 합산 — { 'YYYY-MM-DD': totalSeconds }. 기도잔디 색 농도,
// "오늘 기도시간" 표시 등에 공통으로 씀
export function sumDurationsByDate(sessions) {
  const map = {};
  sessions.forEach((s) => {
    if (!s.date) return;
    map[s.date] = (map[s.date] || 0) + (s.durationSeconds || 0);
  });
  return map;
}

// 구독된 세션 전체(최근 400건)의 총 경과초 — 나이키 런처럼 중간에 끊기든 여러 번 나눠서
// 하든 상관없이 계속 쌓이는 "총 누적 기도시간"
export function sumAllDurations(sessions) {
  return sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
}

function shiftDateStr(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// 날짜별 합계 맵으로 "연속 기록"을 계산 — 하루라도 기도 안 한 날이 끼면 끊김.
// current: 오늘(또는 어제까지, 아직 오늘 기록이 없을 때)부터 거슬러 올라간 연속 일수
// longest: 지금까지 있었던 연속 기록 중 가장 긴 것
export function computeStreaks(byDate, todayDateStr) {
  const activeDates = Object.keys(byDate)
    .filter((d) => (byDate[d] || 0) > 0)
    .sort();
  if (activeDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDates.length; i++) {
    run = shiftDateStr(activeDates[i - 1], 1) === activeDates[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const activeSet = new Set(activeDates);
  let cursor = activeSet.has(todayDateStr) ? todayDateStr : shiftDateStr(todayDateStr, -1);
  let current = 0;
  while (activeSet.has(cursor)) {
    current += 1;
    cursor = shiftDateStr(cursor, -1);
  }

  return { current, longest };
}

// 초 단위를 "N시간 N분 N초"로 — 기도쌓기 관련 시간 표시는 전부 이 형식으로 통일(분 단위로
// 뭉개지 않고 초까지 보여달라는 요청 반영)
export function formatDurationKorean(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}시간`);
  if (h > 0 || m > 0) parts.push(`${m}분`);
  parts.push(`${sec}초`);
  return parts.join(' ');
}
