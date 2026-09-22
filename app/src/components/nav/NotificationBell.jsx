import { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { REMINDER_VERSE, GOLD_LEAF_VERSE, todayStr } from '../../data/constants';
import { listenCellActivity } from '../../lib/prayerData';

const LAST_SEEN_KEY = 'cellssak:lastNotificationSeenAt';
const LAST_SEEN_DATE_KEY = 'cellssak:lastNotificationSeenDate';
const LAST_SEEN_GOLD_SCORE_KEY = 'cellssak:lastNotificationSeenGoldScore';

function readLastSeen() {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function readLastSeenDate() {
  try {
    return localStorage.getItem(LAST_SEEN_DATE_KEY) || '';
  } catch {
    return '';
  }
}

function readLastSeenGoldScore() {
  try {
    return Number(localStorage.getItem(LAST_SEEN_GOLD_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function NotificationBell({ activeCell, myUid, prayedToday, score }) {
  const [open, setOpen] = useState(false);
  const [cellActivity, setCellActivity] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(readLastSeen);
  const [lastSeenDate, setLastSeenDate] = useState(readLastSeenDate);
  const [lastSeenGoldScore, setLastSeenGoldScore] = useState(readLastSeenGoldScore);

  useEffect(() => {
    if (!activeCell) {
      setCellActivity([]);
      return;
    }
    const unsubscribe = listenCellActivity(activeCell.churchId, activeCell.cellId, setCellActivity);
    return unsubscribe;
  }, [activeCell?.churchId, activeCell?.cellId]);

  // 다른 셀원이 열매로 바꾼 것만 — 내가 한 건 이미 그 자리에서 토스트로 봤으니 또 안 보여줌
  const fruitNotifications = useMemo(
    () => cellActivity.filter((a) => a.type === 'fruit' && a.actorUid !== myUid),
    [cellActivity, myUid]
  );

  const showReminder = !prayedToday;
  const showGoldLeaf = score > 0 && score % 7 === 0;

  // 기도 리마인더/황금 나뭇잎은 "아직 기도 안 함"/"7의 배수 점수"처럼 상태 그 자체라, 이걸로
  // 바로 안 읽음 표시를 하면 한 번 열어봐도 그 상태가 안 바뀌는 한(기도 안 하거나 점수가 그대로면)
  // 계속 빨갛게 남아있었음 — 오늘 한 번 열어봤는지(리마인더), 이 점수를 이미 봤는지(황금 잎)
  // 따로 기억해서, 확인하고 나면 그 상태가 실제로 바뀌기 전까진 다시 안 뜨게 함
  const today = todayStr();
  const reminderUnread = showReminder && lastSeenDate !== today;
  const goldLeafUnread = showGoldLeaf && score > lastSeenGoldScore;
  const hasUnread = reminderUnread || goldLeafUnread || fruitNotifications.some((a) => a.createdAt > lastSeenAt);

  const handleOpen = () => {
    setOpen(true);
    const now = Date.now();
    const today = todayStr();
    setLastSeenAt(now);
    setLastSeenDate(today);
    if (showGoldLeaf) setLastSeenGoldScore(score);
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(now));
      localStorage.setItem(LAST_SEEN_DATE_KEY, today);
      if (showGoldLeaf) localStorage.setItem(LAST_SEEN_GOLD_SCORE_KEY, String(score));
    } catch {
      // 저장 실패해도 이번 세션 안에서는 정상 동작하니 무시
    }
  };

  const isEmpty = !showReminder && !showGoldLeaf && fruitNotifications.length === 0;

  return (
    <>
      <button
        onClick={handleOpen}
        style={{ background: '#FFFDF9', color: '#4A3B3F', width: '30px', height: '30px', position: 'relative' }}
        className="flex items-center justify-center rounded-full shadow-sm shrink-0"
        aria-label="알림"
      >
        <Bell size={14} />
        {hasUnread && (
          <span
            style={{ background: '#F2678A', width: '9px', height: '9px', border: '1.5px solid #FFFDF9' }}
            className="absolute -top-0.5 -right-0.5 rounded-full"
          />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6" style={{ maxWidth: '384px', margin: '0 auto' }}>
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={() => setOpen(false)} />
          <div
            style={{ background: 'var(--paper, #FFF8F0)', color: 'var(--ink, #4A3B3F)', maxHeight: '70vh' }}
            className="relative w-full rounded-3xl shadow-xl px-5 py-6 flex flex-col gap-2.5 overflow-y-auto"
          >
            <p style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", fontSize: '1.1rem' }}>알림</p>

            {isEmpty && (
              <p style={{ color: '#9C8286' }} className="text-sm text-center py-8">
                아직 알림이 없어요.
              </p>
            )}

            {showGoldLeaf && <NotificationItem emoji="🌟" title="황금 나뭇잎이 자랐어요!" verse={GOLD_LEAF_VERSE} />}
            {showReminder && <NotificationItem emoji="🙏" title="기도할 시간이에요" verse={REMINDER_VERSE} />}

            {fruitNotifications.map((a) => (
              <NotificationItem key={a.id} emoji="🎉" title={`${a.prayerName}님의 기도가 믿음의 열매를 맺었어요!`} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function NotificationItem({ emoji, title, verse }) {
  return (
    <div style={{ background: '#F5F0E8' }} className="rounded-2xl px-3.5 py-3">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <span>{emoji}</span> {title}
      </p>
      {verse && (
        <p style={{ color: '#9C8286' }} className="text-xs mt-1 italic leading-relaxed">
          &ldquo;{verse.text}&rdquo; — {verse.ref}
        </p>
      )}
    </div>
  );
}
