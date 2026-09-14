import { useState } from 'react';
import { Music, Music2 } from 'lucide-react';

// 화면 중앙을 차지하는 큰 플레이어가 아니라, 작은 음표 아이콘 하나 + 눌렀을 때만 나오는
// 작은 팝오버. 타이머보다 시각적으로 절대 강조되면 안 된다는 요구사항 때문에 일부러 이렇게 작게 둠.
export default function MusicToggle({ isOn, toggle, volume, changeVolume, hasTracks }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const Icon = isOn ? Music2 : Music;

  return (
    <div className="relative">
      <button
        aria-label="기도 음악"
        onClick={() => setPanelOpen((v) => !v)}
        style={{ background: 'var(--paper)', color: isOn ? '#5C7A55' : 'var(--ink-soft)' }}
        className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        <Icon size={15} />
      </button>

      {panelOpen && (
        <div
          style={{ background: 'var(--paper)', borderRadius: '16px', right: 0, top: '44px', width: '176px' }}
          className="absolute shadow-md px-4 py-3.5 flex flex-col gap-3 z-10"
        >
          <button
            onClick={toggle}
            className="flex items-center justify-between"
          >
            <span style={{ fontSize: '0.82rem' }}>기도 음악</span>
            <span style={{ color: isOn ? '#5C7A55' : 'var(--ink-soft)', fontSize: '0.78rem' }}>
              {isOn ? '♪ ON' : '♪ OFF'}
            </span>
          </button>

          {hasTracks ? (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              style={{ accentColor: '#5C7A55' }}
              aria-label="음악 볼륨"
            />
          ) : (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.7rem', lineHeight: 1.5 }}>
              아직 준비된 곡이 없어요. 곧 채워질 예정이에요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
