// 성경 책 목록과 장 수.
//
// 본문(절의 내용)은 아직 없다 — 개역개정 등 한국어 번역은 대한성서공회가 저작권을
// 가지고 있어서 앱에 담으려면 사용 허가(기본 저작권료 + 매년 갱신)가 필요하다.
// 그래서 지금은 "어디를 읽을지"만 고르게 하고(창세기 1:1-5 같은 장절 표기 자동 생성),
// 본문은 셀장이 붙여넣는다. 나중에 허가를 받으면 loadPassageText만 실제 구현으로
// 바꾸면 되고, 그 위의 화면은 그대로 둬도 된다.
//
// 책 이름과 장 수는 사실 정보라 저작권과 무관하다.

export const BIBLE_BOOKS = [
  // 구약 39권
  { name: '창세기', chapters: 50, testament: 'old' },
  { name: '출애굽기', chapters: 40, testament: 'old' },
  { name: '레위기', chapters: 27, testament: 'old' },
  { name: '민수기', chapters: 36, testament: 'old' },
  { name: '신명기', chapters: 34, testament: 'old' },
  { name: '여호수아', chapters: 24, testament: 'old' },
  { name: '사사기', chapters: 21, testament: 'old' },
  { name: '룻기', chapters: 4, testament: 'old' },
  { name: '사무엘상', chapters: 31, testament: 'old' },
  { name: '사무엘하', chapters: 24, testament: 'old' },
  { name: '열왕기상', chapters: 22, testament: 'old' },
  { name: '열왕기하', chapters: 25, testament: 'old' },
  { name: '역대상', chapters: 29, testament: 'old' },
  { name: '역대하', chapters: 36, testament: 'old' },
  { name: '에스라', chapters: 10, testament: 'old' },
  { name: '느헤미야', chapters: 13, testament: 'old' },
  { name: '에스더', chapters: 10, testament: 'old' },
  { name: '욥기', chapters: 42, testament: 'old' },
  { name: '시편', chapters: 150, testament: 'old' },
  { name: '잠언', chapters: 31, testament: 'old' },
  { name: '전도서', chapters: 12, testament: 'old' },
  { name: '아가', chapters: 8, testament: 'old' },
  { name: '이사야', chapters: 66, testament: 'old' },
  { name: '예레미야', chapters: 52, testament: 'old' },
  { name: '예레미야애가', chapters: 5, testament: 'old' },
  { name: '에스겔', chapters: 48, testament: 'old' },
  { name: '다니엘', chapters: 12, testament: 'old' },
  { name: '호세아', chapters: 14, testament: 'old' },
  { name: '요엘', chapters: 3, testament: 'old' },
  { name: '아모스', chapters: 9, testament: 'old' },
  { name: '오바댜', chapters: 1, testament: 'old' },
  { name: '요나', chapters: 4, testament: 'old' },
  { name: '미가', chapters: 7, testament: 'old' },
  { name: '나훔', chapters: 3, testament: 'old' },
  { name: '하박국', chapters: 3, testament: 'old' },
  { name: '스바냐', chapters: 3, testament: 'old' },
  { name: '학개', chapters: 2, testament: 'old' },
  { name: '스가랴', chapters: 14, testament: 'old' },
  { name: '말라기', chapters: 4, testament: 'old' },
  // 신약 27권
  { name: '마태복음', chapters: 28, testament: 'new' },
  { name: '마가복음', chapters: 16, testament: 'new' },
  { name: '누가복음', chapters: 24, testament: 'new' },
  { name: '요한복음', chapters: 21, testament: 'new' },
  { name: '사도행전', chapters: 28, testament: 'new' },
  { name: '로마서', chapters: 16, testament: 'new' },
  { name: '고린도전서', chapters: 16, testament: 'new' },
  { name: '고린도후서', chapters: 13, testament: 'new' },
  { name: '갈라디아서', chapters: 6, testament: 'new' },
  { name: '에베소서', chapters: 6, testament: 'new' },
  { name: '빌립보서', chapters: 4, testament: 'new' },
  { name: '골로새서', chapters: 4, testament: 'new' },
  { name: '데살로니가전서', chapters: 5, testament: 'new' },
  { name: '데살로니가후서', chapters: 3, testament: 'new' },
  { name: '디모데전서', chapters: 6, testament: 'new' },
  { name: '디모데후서', chapters: 4, testament: 'new' },
  { name: '디도서', chapters: 3, testament: 'new' },
  { name: '빌레몬서', chapters: 1, testament: 'new' },
  { name: '히브리서', chapters: 13, testament: 'new' },
  { name: '야고보서', chapters: 5, testament: 'new' },
  { name: '베드로전서', chapters: 5, testament: 'new' },
  { name: '베드로후서', chapters: 3, testament: 'new' },
  { name: '요한일서', chapters: 5, testament: 'new' },
  { name: '요한이서', chapters: 1, testament: 'new' },
  { name: '요한삼서', chapters: 1, testament: 'new' },
  { name: '유다서', chapters: 1, testament: 'new' },
  { name: '요한계시록', chapters: 22, testament: 'new' },
];

export function findBook(name) {
  return BIBLE_BOOKS.find((b) => b.name === name);
}

// "시편 23:1-3" / "시편 23" 같은 장절 표기를 만든다
export function formatRef(book, chapter, fromVerse, toVerse) {
  if (!book || !chapter) return '';
  if (!fromVerse) return `${book} ${chapter}`;
  if (!toVerse || toVerse === fromVerse) return `${book} ${chapter}:${fromVerse}`;
  return `${book} ${chapter}:${fromVerse}-${toVerse}`;
}

// 본문을 앱에 담을 수 있는 상태인지 — 허가를 받아 데이터를 넣으면 true로 바꾸고
// loadPassageText를 실제 구현으로 교체한다. 화면은 이 값만 보고 분기한다
export const BIBLE_TEXT_AVAILABLE = false;

// 장절에 해당하는 본문을 가져온다. 허가 전까지는 항상 null이고, 화면은 null이면
// "본문을 붙여넣어 주세요"로 안내한다.
//
// 나중에 구현할 때 주의할 점: 성경 전체는 텍스트만 4~5MB라 앱에 통째로 넣으면 첫 로딩이
// 느려진다. 책 단위(또는 장 단위) 파일로 쪼개 두고 동적 import로 그때그때 불러올 것.
// 예) const data = await import(`./bible/${book}.json`)
export async function loadPassageText() {
  return null;
}
