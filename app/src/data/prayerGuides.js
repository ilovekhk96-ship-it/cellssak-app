// "어떻게 기도할까요?" 기도 가이드 데이터 — 지금은 콘텐츠 없이 구조만 준비.
// 실제 가이드 본문은 나중에 하경이 직접(목사님 추천 등으로) 작성해서 여기 배열에 추가한다.
// 관리자가 추가하기 쉽도록 이 배열에 객체를 채워 넣기만 하면 자동으로 목록/상세 화면에 반영됨.
//
// 각 가이드의 모양:
// {
//   id: 'unique-slug',       // 고유 id
//   title: '가이드 제목',
//   description: '한 줄 설명(목록에 작게 표시)',
//   body: '본문 (여러 문단은 \n\n으로 구분)',
//   order: 1,                // 목록에서의 정렬 순서(작을수록 위)
//   source: '출처 또는 작성자(선택, 없으면 표시 안 함)',
// }
export const PRAYER_GUIDES = [];

export function sortedPrayerGuides() {
  return [...PRAYER_GUIDES].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
