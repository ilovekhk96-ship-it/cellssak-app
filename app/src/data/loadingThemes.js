import { Sprout } from 'lucide-react';

// 로딩화면에서 테마마다 달라질 값들을 한 곳에 모아둔 설정 — AppRoot.jsx의 Loading 컴포넌트는
// 이 객체에서 값을 읽어서 그리기만 하고, 테마별 디자인 값은 전부 여기서 관리한다.
// 지금은 실사(real) 테마만 채워져 있고, 나머지 4개는 그림/색이 준비되는 대로 같은 모양으로
// 추가하면 된다 (AppRoot.jsx는 수정할 필요 없음).
export const LOADING_THEMES = {
  real: {
    background: "url('/images/loading.jpg') center / cover no-repeat",
    titleFont: "'Gowun Batang', serif",
    titleWeight: 700,
    titleColor: '#4A3B3F',
    subtitleFont: "'Gowun Dodum', sans-serif",
    subtitleColor: '#7A6E68',
    progressTrackColor: 'rgba(250, 247, 240, 0.55)',
    progressFillColor: '#5C7A55',
    loadingMessage: '나무를 깨우는 중...',
    decoration: Sprout,
    decorationColor: '#5C7A55',
  },

  // 아래 4개는 구조만 미리 잡아둔 것 — 각 테마 그림/폰트가 준비되면 real과 같은 형태로 채우면 됨.
  // vector: { background, titleFont, titleWeight, titleColor, subtitleFont, subtitleColor,
  //           progressTrackColor, progressFillColor, loadingMessage, decoration, decorationColor }
  // pixel: { ... }
  // illustration: { ... }
  // character: { ... }
};

export const DEFAULT_LOADING_THEME = 'real';

export function getLoadingTheme(themeId) {
  return LOADING_THEMES[themeId] || LOADING_THEMES[DEFAULT_LOADING_THEME];
}
