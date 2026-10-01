import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { todayStr } from '../../data/constants';
import { savePrayerSession } from '../../lib/prayerSessions';
import { usePrayerTimer, formatHMS } from '../../hooks/usePrayerTimer';
import { usePrayerMusic } from '../../hooks/usePrayerMusic';
import MusicToggle from './MusicToggle';
import GroupPrayerChat from './GroupPrayerChat';
import {
  listenGroupPrayer,
  listenParticipants,
  joinGroupPrayer,
  touchParticipant,
  leaveGroupPrayer,
  setCurrentIndex,
  livePresence,
} from '../../lib/groupPrayer';

// 함께 기도 화면 — 같은 시간에 같은 말씀 앞에 모인다.
//
// 'leader' 모드는 인도자가 넘긴 장(currentIndex)을 모두가 따라가고, 'self' 모드는 각자
// 자기 속도로 넘긴다. 그래서 지금 보고 있는 장은 모드에 따라 출처가 다르다
// (서버의 currentIndex냐, 내 화면의 상태냐).
//
// 기도 시간은 혼자 할 때와 똑같이 savePrayerSession으로 저장한다 — 그래야 함께 기도한
// 시간도 개인 기록과 셀 전체 합계에 자동으로 들어간다.
const HEARTBEAT_MS = 40 * 1000;

export default function GroupPrayerSession({ user, churchId, cellId, groupPrayer, isLeader, onClose }) {
  const timer = usePrayerTimer();
  const music = usePrayerMusic();
  const [gp, setGp] = useState(groupPrayer);
  const [participants, setParticipants] = useState([]);
  const [myIndex, setMyIndex] = useState(0); // 'self' 모드에서 내가 보고 있는 장
  const [ending, setEnding] = useState(false);
  const startedRef = useRef(false);

  const gpId = groupPrayer.id;
  const passages = gp?.passages?.length ? gp.passages : [{ ref: '', text: '' }];
  const leaderMode = gp?.mode === 'leader';
  // 인도자 진행이면 서버가 정한 장을, 각자 속도면 내 화면의 장을 본다
  const index = Math.min(leaderMode ? gp?.currentIndex ?? 0 : myIndex, passages.length - 1);
  const passage = passages[index];
  const canTurn = leaderMode ? isLeader : true;

  // 약속 문서 구독 — 인도자가 넘긴 장이 여기로 흘러온다
  useEffect(() => {
    const unsubscribe = listenGroupPrayer(churchId, cellId, gpId, (doc) => {
      if (doc) setGp(doc);
    });
    return unsubscribe;
  }, [churchId, cellId, gpId]);

  // 들어왔음을 알리고, 머무는 동안 주기적으로 "아직 있음"을 갱신한다.
  // 나갈 때 지우지만, 앱이 갑자기 꺼지면 못 지우므로 세는 쪽에서 오래된 사람을 걸러낸다
  useEffect(() => {
    joinGroupPrayer(churchId, cellId, gpId, user).catch(() => {});
    const id = setInterval(() => {
      touchParticipant(churchId, cellId, gpId, user.uid).catch(() => {});
    }, HEARTBEAT_MS);
    return () => {
      clearInterval(id);
      leaveGroupPrayer(churchId, cellId, gpId, user.uid).catch(() => {});
    };
  }, [churchId, cellId, gpId, user]);

  useEffect(() => {
    const unsubscribe = listenParticipants(churchId, cellId, gpId, setParticipants);
    return unsubscribe;
  }, [churchId, cellId, gpId]);

  // 들어오자마자 기도 시간이 흐르기 시작한다 — 따로 "시작" 버튼을 누르게 하면
  // 같이 기도하러 들어온 사람이 한 번 더 손을 쓰게 되어 흐름이 끊긴다
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const turn = (next) => {
    const clamped = Math.max(0, Math.min(next, passages.length - 1));
    if (leaderMode) {
      setCurrentIndex(churchId, cellId, gpId, clamped).catch(() => {});
    } else {
      setMyIndex(clamped);
    }
  };

  // 나가기 — 지금까지 잰 시간을 저장하고 화면을 닫는다. 빠르게 여러 번 눌러도
  // 중복 저장되지 않도록 ending으로 막는다
  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    const { durationSeconds, startedAt, endedAt } = timer.end();
    if (music.isOn) music.toggle();
    try {
      await savePrayerSession({
        uid: user.uid,
        activeCell: { churchId, cellId },
        startedAt,
        endedAt,
        durationSeconds,
        date: todayStr(),
      });
    } catch (e) {
      // 저장에 실패해도 기도 자체를 막을 이유는 없으니 화면은 정상적으로 닫는다
    }
    onClose();
  };

  const here = livePresence(participants);

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 60%, #C3E9B9 100%)',
        color: '#4A3B3F',
        fontFamily: "'Gowun Dodum', sans-serif",
      }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <span
          style={{ background: '#FFFDF9' }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs shadow-sm"
        >
          <Users size={12} style={{ color: '#6FA66B' }} />
          {here.length}명이 함께 기도 중
        </span>
        <div className="flex items-center gap-2">
          <MusicToggle
            isOn={music.isOn}
            toggle={music.toggle}
            volume={music.volume}
            changeVolume={music.changeVolume}
            hasTracks={music.hasTracks}
            currentTrack={music.currentTrack}
            nextTrack={music.nextTrack}
          />
          <GroupPrayerChat churchId={churchId} cellId={cellId} gpId={gpId} user={user} />
          <button onClick={handleEnd} disabled={ending} aria-label="나가기" style={{ color: '#9C8286' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 shrink-0">
        <p className="text-base font-bold text-center">{gp?.title}</p>
        <p style={{ color: '#9C8286' }} className="text-xs text-center mt-0.5">
          {formatHMS(timer.displaySeconds)}
        </p>
      </div>

      {/* 말씀 카드 — 길면 이 안에서만 스크롤되고 아래 넘김 버튼은 늘 제자리에 있다 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div style={{ background: '#FFFDF9' }} className="rounded-3xl shadow-sm p-5 min-h-full flex flex-col gap-3">
          {passage.ref && (
            <p style={{ color: '#6FA66B' }} className="text-sm font-bold">
              {passage.ref}
            </p>
          )}
          <p style={{ lineHeight: 1.9 }} className="text-[15px] whitespace-pre-line">
            {passage.text}
          </p>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-6 pt-2 flex items-center justify-between gap-3">
        <button
          onClick={() => turn(index - 1)}
          disabled={!canTurn || index === 0}
          aria-label="이전 말씀"
          style={{ background: '#FFFDF9', color: '#4A3B3F' }}
          className="rounded-full p-2.5 shadow-sm disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>

        <span style={{ color: '#9C8286' }} className="text-xs">
          {passages.length > 1 ? `${index + 1} / ${passages.length}` : ''}
          {leaderMode && !isLeader && (
            <>
              {passages.length > 1 && ' · '}
              인도자를 따라갑니다
            </>
          )}
        </span>

        <button
          onClick={() => turn(index + 1)}
          disabled={!canTurn || index >= passages.length - 1}
          aria-label="다음 말씀"
          style={{ background: '#FFFDF9', color: '#4A3B3F' }}
          className="rounded-full p-2.5 shadow-sm disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
