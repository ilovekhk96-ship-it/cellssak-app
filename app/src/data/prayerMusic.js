// 기도쌓기 배경음악 데이터 — 찬송가 연주곡(가사 없는 버전) 11곡.
// 원곡 보컬 버전 2곡(내 영원한 친구, 예수 만왕의 왕)은 가사가 있어서 기도 중
// 집중을 방해할 수 있어 여기엔 안 넣고 public/audio/_original-worship-unused/에
// 따로 보관 — 나중에 별도 "셀싹 오리지널 찬양" 기능을 만들 때 씀.
//
// 각 트랙의 모양:
// {
//   id: 'unique-slug',
//   title: '곡 제목',
//   category: 'calm' | 'gratitude' | 'comfort' | 'dawn' | 'meditation',
//   src: '/audio/파일명.mp3',
// }
export const PRAYER_TRACKS = [
  { id: 'sweet-hour-of-prayer', title: '기도의 시간', category: 'calm', src: '/audio/sweet-hour-of-prayer.mp3' },
  { id: 'tis-so-sweet-to-trust', title: '신뢰', category: 'meditation', src: '/audio/tis-so-sweet-to-trust.mp3' },
  { id: 'what-a-friend', title: '친구 되신 예수', category: 'comfort', src: '/audio/what-a-friend.mp3' },
  { id: 'it-is-well-with-my-soul', title: '평안', category: 'comfort', src: '/audio/it-is-well-with-my-soul.mp3' },
  { id: 'abide-with-me', title: '함께하소서', category: 'comfort', src: '/audio/abide-with-me.mp3' },
  { id: 'he-leadeth-me', title: '인도하시네', category: 'meditation', src: '/audio/he-leadeth-me.mp3' },
  { id: 'come-thou-fount', title: '은혜의 샘', category: 'gratitude', src: '/audio/come-thou-fount.mp3' },
  { id: 'my-jesus-i-love-thee', title: '사랑합니다', category: 'calm', src: '/audio/my-jesus-i-love-thee.mp3' },
  { id: 'i-need-thee-every-hour', title: '주님이 필요해', category: 'meditation', src: '/audio/i-need-thee-every-hour.mp3' },
  { id: 'blessed-assurance', title: '확신', category: 'gratitude', src: '/audio/blessed-assurance.mp3' },
  { id: 'amazing-grace', title: '나 같은 죄인 살리신', category: 'gratitude', src: '/audio/amazing-grace.mp3' },
];

// 카테고리 라벨 — 향후 트랙이 쌓이면 카테고리별 재생목록 UI에 사용
export const PRAYER_MUSIC_CATEGORIES = [
  { id: 'calm', label: '고요한 기도' },
  { id: 'gratitude', label: '감사' },
  { id: 'comfort', label: '위로' },
  { id: 'dawn', label: '새벽' },
  { id: 'meditation', label: '묵상' },
];
