// 나무에 다는 장식품 — 지금은 실제 이미지 없이 이모지로 자리만 잡아둠. 하경이 지피티로
// 만든 진짜 이미지가 준비되면 각 항목에 image(파일 경로)를 추가하고 TreeScene 렌더링에서
// 이모지 대신 그 이미지를 쓰도록 바꾸면 됨 — 구조(슬롯/카테고리/장착 여부)는 그대로 유지.
//
// 슬롯 = 나무에서 장식이 붙는 고정 자리. 한 슬롯엔 한 번에 하나만 장착 가능(자리 겹침 방지).
// 나무 SVG 좌표계(0~240 안팎, tree.png가 x=-5,y=-3,width=250,height=235로 그려짐) 기준.
export const DECORATION_SLOTS = [
  { id: 'top', x: 120, y: 6 },
  { id: 'left', x: 32, y: 95 },
  { id: 'right', x: 198, y: 105 },
  { id: 'base', x: 120, y: 222 },
];

// 각 장식의 모양: { id, name, category, emoji, slot }
export const DECORATIONS = [
  { id: 'star', name: '별', category: '겨울', emoji: '⭐', slot: 'top' },
  { id: 'snowflake', name: '눈꽃', category: '겨울', emoji: '❄️', slot: 'left' },
  { id: 'bell', name: '종', category: '겨울', emoji: '🔔', slot: 'right' },
  { id: 'wreath', name: '리스', category: '겨울', emoji: '🎄', slot: 'base' },
  { id: 'ribbon', name: '리본', category: '봄', emoji: '🎀', slot: 'left' },
  { id: 'butterfly', name: '나비', category: '봄', emoji: '🦋', slot: 'right' },
  { id: 'sun', name: '햇살', category: '여름', emoji: '☀️', slot: 'top' },
  { id: 'ladybug', name: '무당벌레', category: '여름', emoji: '🐞', slot: 'left' },
  { id: 'leaf-pile', name: '낙엽더미', category: '가을', emoji: '🍂', slot: 'base' },
  { id: 'acorn', name: '도토리', category: '가을', emoji: '🌰', slot: 'right' },
];

export const DECORATION_CATEGORIES = ['겨울', '봄', '여름', '가을'];

export function findDecoration(id) {
  return DECORATIONS.find((d) => d.id === id) || null;
}

export function findSlot(slotId) {
  return DECORATION_SLOTS.find((s) => s.id === slotId) || null;
}
