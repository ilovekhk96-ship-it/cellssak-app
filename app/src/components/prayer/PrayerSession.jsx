import { useState, useEffect, useMemo } from 'react';
import { X, Sprout, Users, HelpCircle } from 'lucide-react';
import { STATUS, todayStr } from '../../data/constants';
import { listenPersonalRequests } from '../../lib/personalPrayer';
import { listenEntries } from '../../lib/prayerData';
import { savePrayerSession, listenRecentPrayerSessions } from '../../lib/prayerSessions';
import { usePrayerTimer, formatHMS } from '../../hooks/usePrayerTimer';
import { usePrayerMusic } from '../../hooks/usePrayerMusic';
import PrayerCardViewer from './PrayerCardViewer';
import PrayerGuidePanel from './PrayerGuidePanel';
import MusicToggle from './MusicToggle';

const DND_HINT_KEY = 'cellssak_prayer_dnd_hint_seen';

const BOOKMARKS = [
  { key: 'mine', label: '나의 기도', icon: Sprout, panelTitle: '나의 기도' },
  { key: 'intercession', label: '중보기도', icon: Users, panelTitle: '중보기도' },
  { key: 'guide', label: '가이드', icon: HelpCircle, panelTitle: '어떻게 기도할까요?' },
];

function toCard(entry) {
  const badge = STATUS[entry.status]
    ? { label: STATUS[entry.status].label, color: STATUS[entry.status].color, soft: STATUS[entry.status].soft }
    : null;
  return {
    key: entry.id,
    title: entry.targetName,
    subtitle: entry.relationship || '',
    body: entry.note || '',
    badge,
  };
}

// "기도 집중 공간" — 기도쌓기 화면. 우선순위는 항상 1)기도시간 2)지금 보는 기도 내용
// 3)책갈피(나의기도/중보기도/가이드) 4)음악 5)기타이고, 평소엔 타이머만 보이다가 책갈피를
// 눌렀을 때만 해당 콘텐츠가 아래에서 올라온다. 타이머/음악/책갈피 상태는 서로 완전히 분리돼
// 있어서 하나를 조작해도 다른 것에 영향을 주지 않는다.
export default function PrayerSession({ user, activeCell, onClose }) {
  const timer = usePrayerTimer();
  const music = usePrayerMusic();
  const [activeBookmark, setActiveBookmark] = useState(null); // null | 'mine' | 'intercession' | 'guide'
  const [myRequests, setMyRequests] = useState([]);
  const [cellEntries, setCellEntries] = useState([]);
  const [todaySavedSeconds, setTodaySavedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [dndHintSeen, setDndHintSeen] = useState(() => {
    try {
      return localStorage.getItem(DND_HINT_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unsubscribe = listenPersonalRequests(user.uid, setMyRequests);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (!activeCell) {
      setCellEntries([]);
      return undefined;
    }
    const unsubscribe = listenEntries(activeCell.churchId, activeCell.cellId, setCellEntries);
    return unsubscribe;
  }, [activeCell?.churchId, activeCell?.cellId]);

  // 오늘 이미 저장된(=종료된) 기도쌓기 시간 — 지금 진행 중인 타이머와는 별개로, "오늘 지금까지
  // 얼마나 쌓았는지" 감을 보여주기 위한 용도. 현재 세션이 끝나 저장되면 실시간으로 반영됨
  useEffect(() => {
    const unsubscribe = listenRecentPrayerSessions(user.uid, (sessions) => {
      const today = todayStr();
      const seconds = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
      setTodaySavedSeconds(seconds);
    });
    return unsubscribe;
  }, [user.uid]);

  const myCards = useMemo(() => myRequests.map(toCard), [myRequests]);

  // 셀원들이 나눈 것 중 내가 쓴 건 "나의 기도" 쪽에 이미 보이니 여기선 제외해서 중복을 없앰.
  // 누가 요청한 기도인지는 subtitle에 이름만 작게 붙여서 내용보다 강조되지 않게 함
  const intercessionCards = useMemo(
    () =>
      cellEntries
        .filter((e) => e.authorUid !== user.uid)
        .map((e) => ({ ...toCard(e), subtitle: e.prayerName ? `${e.prayerName}님의 기도` : '' })),
    [cellEntries, user.uid]
  );

  const dismissDndHint = () => {
    setDndHintSeen(true);
    try {
      localStorage.setItem(DND_HINT_KEY, '1');
    } catch {
      // 저장 안 돼도 이번 화면에서는 이미 닫힌 채로 유지되니 문제 없음
    }
  };

  // "기도 종료"든 상단 닫기(X)든 같은 동작 — 지금까지 잰 시간을 저장하고 화면을 나감.
  // ending 플래그로 감싸서 빠르게 여러 번 눌러도 세션이 중복 저장되지 않게 함
  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    const { durationSeconds, startedAt, endedAt } = timer.end();
    if (music.isOn) music.toggle();
    try {
      await savePrayerSession({
        uid: user.uid,
        activeCell,
        startedAt,
        endedAt,
        durationSeconds,
        date: todayStr(),
      });
    } catch (e) {
      // 저장에 실패해도 기도 자체를 막을 이유는 없으니 화면은 정상적으로 닫음
    }
    onClose();
  };

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--paper': '#FFFDF9',
    '--font-display': "'Gowun Batang', serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  const activePanel = BOOKMARKS.find((b) => b.key === activeBookmark) || null;

  return (
    <div
      style={{
        ...vars,
        background: 'linear-gradient(180deg, #FFF8F0 0%, #F3F0E5 100%)',
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
      }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        <button
          onClick={handleEnd}
          aria-label="기도 종료하고 나가기"
          disabled={ending}
          style={{ background: 'var(--paper)', color: 'var(--ink)' }}
          className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center active:scale-90 transition-transform disabled:opacity-60"
        >
          <X size={16} />
        </button>
        <MusicToggle
          isOn={music.isOn}
          toggle={music.toggle}
          volume={music.volume}
          changeVolume={music.changeVolume}
          hasTracks={music.hasTracks}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 min-h-0">
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>기도쌓기</p>
        {todaySavedSeconds > 0 && (
          <p style={{ color: '#5C7A55', fontSize: '0.75rem' }}>오늘 나의 기도시간 {Math.round(todaySavedSeconds / 60)}분</p>
        )}
        <p
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.6rem', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatHMS(timer.displaySeconds)}
        </p>

        {!dndHintSeen && timer.status === 'idle' && (
          <div
            style={{ background: 'var(--paper)', borderRadius: '999px' }}
            className="flex items-center gap-2 pl-4 pr-2.5 py-2 shadow-sm"
          >
            <span style={{ color: 'var(--ink-soft)', fontSize: '0.72rem' }}>
              기도하는 동안 휴대폰 방해금지 모드를 켜보세요
            </span>
            <button onClick={dismissDndHint} aria-label="닫기" style={{ color: 'var(--ink-soft)' }} className="shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {timer.status === 'idle' && (
            <button
              onClick={timer.start}
              style={{ background: '#5C7A55', color: '#FFF8F0' }}
              className="px-8 py-3 rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
            >
              기도 시작
            </button>
          )}
          {timer.status === 'running' && (
            <>
              <button
                onClick={timer.pause}
                style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                className="px-6 py-3 rounded-full text-sm shadow-sm active:scale-95 transition-transform"
              >
                일시정지
              </button>
              <button
                onClick={handleEnd}
                disabled={ending}
                style={{ background: '#5C7A55', color: '#FFF8F0' }}
                className="px-6 py-3 rounded-full text-sm shadow-md active:scale-95 transition-transform disabled:opacity-60"
              >
                기도 종료
              </button>
            </>
          )}
          {timer.status === 'paused' && (
            <>
              <button
                onClick={timer.start}
                style={{ background: '#5C7A55', color: '#FFF8F0' }}
                className="px-6 py-3 rounded-full text-sm shadow-md active:scale-95 transition-transform"
              >
                이어서 시작
              </button>
              <button
                onClick={handleEnd}
                disabled={ending}
                style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                className="px-6 py-3 rounded-full text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-60"
              >
                기도 종료
              </button>
            </>
          )}
        </div>
      </div>

      <div
        style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)' }}
        className="flex flex-col gap-2 z-10"
      >
        {BOOKMARKS.map((b) => {
          const active = activeBookmark === b.key;
          const Icon = b.icon;
          return (
            <button
              key={b.key}
              onClick={() => setActiveBookmark(active ? null : b.key)}
              style={{
                background: active ? '#5C7A55' : 'var(--paper)',
                color: active ? '#FFF8F0' : 'var(--ink)',
                borderRadius: '12px 0 0 12px',
              }}
              className="w-12 py-3 flex flex-col items-center gap-1 shadow-sm"
            >
              <Icon size={15} />
              <span style={{ fontSize: '8px', lineHeight: '9px' }}>{b.label}</span>
            </button>
          );
        })}
      </div>

      {activePanel && (
        <div
          style={{ background: 'var(--paper)', borderRadius: '24px 24px 0 0', maxHeight: '58vh' }}
          className="relative z-20 flex flex-col shadow-lg shrink-0"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{activePanel.panelTitle}</span>
            <button onClick={() => setActiveBookmark(null)} aria-label="닫기" style={{ color: 'var(--ink-soft)' }}>
              <X size={16} />
            </button>
          </div>
          {activePanel.key === 'mine' && (
            <PrayerCardViewer
              items={myCards}
              emptyText={'아직 등록한 기도제목이 없어요.\n기도나무 화면에서 먼저 심어보세요.'}
            />
          )}
          {activePanel.key === 'intercession' && (
            <PrayerCardViewer
              items={intercessionCards}
              emptyText={activeCell ? '아직 셀원들이 나눈 중보기도가 없어요.' : '아직 속한 모임이 없어요.'}
            />
          )}
          {activePanel.key === 'guide' && <PrayerGuidePanel />}
        </div>
      )}
    </div>
  );
}
