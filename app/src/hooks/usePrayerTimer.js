import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cellssak_prayer_timer_v1';
// 이 시간 이상 'running'/'paused' 상태로 방치돼 있었다면 앱을 완전히 떠난 것으로 보고
// 이어서 카운트하지 않고 버림(며칠 뒤에 열었는데 수십 시간이 찍혀 있는 걸 방지)
const STALE_MS = 6 * 60 * 60 * 1000;

// 기도쌓기 스톱워치 — setInterval로 숫자를 1씩 더하는 방식이 아니라, "이번 구간이 시작된
// 절대 시각(runStartedAt)"과 "그 전까지 누적된 초(accumulated)"만 들고 있다가 매번
// Date.now()로 다시 계산한다. 그래서 백그라운드 탭 스로틀링이나 렌더링 지연으로 setInterval
// 틱이 밀리거나 몇 번 건너뛰어도, 다음 틱에서 실제 경과시간과 화면 숫자가 항상 맞다.
export function usePrayerTimer() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const accumulatedRef = useRef(0); // 이전에 멈춘 구간들까지의 누적 초
  const runStartedAtRef = useRef(null); // 현재 구간이 시작된 절대 시각(ms) — running일 때만 존재
  const sessionStartedAtRef = useRef(null); // "기도 시작"을 맨 처음 누른 절대 시각(ms) — 저장용

  const computeElapsed = useCallback(() => {
    const runPart = runStartedAtRef.current != null ? (Date.now() - runStartedAtRef.current) / 1000 : 0;
    return accumulatedRef.current + runPart;
  }, []);

  const persist = useCallback((nextStatus) => {
    if (nextStatus === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          status: nextStatus,
          accumulated: accumulatedRef.current,
          runStartedAt: runStartedAtRef.current,
          sessionStartedAt: sessionStartedAtRef.current,
          savedAt: Date.now(),
        })
      );
    } catch {
      // localStorage 사용 불가(프라이빗 모드 등)해도 타이머 자체는 정상 동작해야 하니 무시
    }
  }, []);

  // 마운트 시 복구: 새로고침이나 화면 전환 후 돌아왔을 때 진행 중이던 세션을 이어감.
  // runStartedAt은 절대 시각이라 그 값을 그대로 쓰면 background에 있던 시간까지 자동으로 포함됨.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      const referenceTime = saved.status === 'running' ? saved.runStartedAt : saved.savedAt;
      if (!referenceTime || Date.now() - referenceTime > STALE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      sessionStartedAtRef.current = saved.sessionStartedAt;
      accumulatedRef.current = saved.accumulated || 0;
      if (saved.status === 'running') {
        runStartedAtRef.current = saved.runStartedAt;
        setStatus('running');
      } else {
        runStartedAtRef.current = null;
        setStatus('paused');
      }
      setDisplaySeconds(Math.floor(computeElapsed()));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면 숫자만 1초마다 갱신 — 실제 값은 항상 timestamp로 재계산되므로 이 interval이 밀려도 무관
  useEffect(() => {
    if (status !== 'running') return undefined;
    const id = setInterval(() => setDisplaySeconds(Math.floor(computeElapsed())), 1000);
    return () => clearInterval(id);
  }, [status, computeElapsed]);

  const start = useCallback(() => {
    if (status === 'running') return;
    const now = Date.now();
    runStartedAtRef.current = now;
    if (status === 'idle') sessionStartedAtRef.current = now;
    setStatus('running');
    setDisplaySeconds(Math.floor(computeElapsed()));
    persist('running');
  }, [status, computeElapsed, persist]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    accumulatedRef.current = computeElapsed();
    runStartedAtRef.current = null;
    setStatus('paused');
    setDisplaySeconds(Math.floor(accumulatedRef.current));
    persist('paused');
  }, [status, computeElapsed, persist]);

  // 종료 — 최종 경과초/세션 시작시각을 돌려주고 내부 상태를 idle로 초기화
  const end = useCallback(() => {
    const durationSeconds = computeElapsed();
    const startedAt = sessionStartedAtRef.current;
    accumulatedRef.current = 0;
    runStartedAtRef.current = null;
    sessionStartedAtRef.current = null;
    setStatus('idle');
    setDisplaySeconds(0);
    persist('idle');
    return { durationSeconds, startedAt, endedAt: Date.now() };
  }, [computeElapsed, persist]);

  return { status, displaySeconds, start, pause, end };
}

export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
