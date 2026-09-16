import { useState, useRef, useEffect, useCallback } from 'react';
import { PRAYER_TRACKS } from '../data/prayerMusic';

const VOLUME_KEY = 'cellssak_prayer_music_volume';

function readSavedVolume() {
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0.6;
  } catch {
    return 0.6;
  }
}

// 음악 상태는 타이머 상태와 완전히 분리 — 이 훅은 기도 시간이 얼마나 지났는지 전혀 모르고,
// 타이머 쪽도 음악이 켜져 있는지 모른다. 그래서 타이머를 일시정지해도 음악은 그대로 흐르고,
// 음악을 껐다 켜도 타이머는 영향을 받지 않는다.
export function usePrayerMusic() {
  const [isOn, setIsOn] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(readSavedVolume);
  const audioRef = useRef(null);

  const currentTrack = PRAYER_TRACKS[trackIndex] || null;
  const hasTracks = PRAYER_TRACKS.length > 0;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // 곡 하나만 반복하지 않고 끝나면 다음 곡으로 자연스럽게 넘어가도록
      audioRef.current.addEventListener('ended', () => {
        setTrackIndex((i) => (i + 1) % Math.max(PRAYER_TRACKS.length, 1));
      });
    }
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isOn) {
      if (!audio.src.endsWith(currentTrack.src)) audio.src = currentTrack.src;
      // 브라우저 자동재생 제한으로 실패할 수 있으나(사용자가 이미 켠 조작이라 보통은 통과),
      // 실패해도 화면이나 타이머에는 영향 없게 조용히 무시
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isOn, currentTrack]);

  // 다음 곡으로 직접 넘기기 — 재생 중이면 그 자리에서 바로 다음 곡이 이어서 나옴
  const nextTrack = useCallback(() => {
    setTrackIndex((i) => (i + 1) % Math.max(PRAYER_TRACKS.length, 1));
  }, []);

  // 기도쌓기 화면을 나가면(언마운트) 음악도 확실히 정지
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggle = useCallback(() => setIsOn((v) => !v), []);

  const changeVolume = useCallback((v) => {
    setVolume(v);
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      // 저장 실패해도 이번 세션 재생 자체엔 지장 없음
    }
  }, []);

  return { isOn, toggle, volume, changeVolume, currentTrack, hasTracks, nextTrack };
}
