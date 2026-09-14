// 기도쌓기 배경음악 데이터 — 지금은 실제 음원 없이 구조만 준비.
// 음원은 나중에 하경이 직접 준비한(사용 권한 확보된 AI instrumental 등) 파일을
// public/audio/ 에 넣고 아래 배열에 등록하면 자동으로 재생 목록에 반영됨.
//
// 각 트랙의 모양:
// {
//   id: 'unique-slug',
//   title: '곡 제목',
//   category: 'calm' | 'gratitude' | 'comfort' | 'dawn' | 'meditation',
//   src: '/audio/파일명.mp3',
// }
export const PRAYER_TRACKS = [];

// 카테고리 라벨 — 향후 트랙이 쌓이면 카테고리별 재생목록 UI에 사용
export const PRAYER_MUSIC_CATEGORIES = [
  { id: 'calm', label: '고요한 기도' },
  { id: 'gratitude', label: '감사' },
  { id: 'comfort', label: '위로' },
  { id: 'dawn', label: '새벽' },
  { id: 'meditation', label: '묵상' },
];
