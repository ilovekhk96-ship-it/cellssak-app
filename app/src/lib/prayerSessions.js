import { collection, doc, setDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logPersonalPrayerForToday } from './personalPrayer';
import { logPrayerForToday } from './prayerData';

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
