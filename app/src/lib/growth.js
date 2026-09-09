// 나무 성장(황금 잎) 관련 계산 — 순수 함수라 컴포넌트에서 useMemo로 감싸서 씀

// 개인 기도나무: dailyActivity가 하루 1개(=1잎)라서, 활동일 수(score) 자체가 곧 인덱스+1과
// 같음 — 7,14,21번째 활동일에 해당하는 잎을 금색으로
export function personalGoldenIndices(score) {
  const indices = new Set();
  for (let i = 6; i < score; i += 7) indices.add(i);
  return indices;
}

// 셀 나무: 잎이 여러 사람 몫이 날짜순으로 섞여 쌓이므로, "셀 전체가 7개째"가 아니라
// "나(myUid)의 7번째 활동일"에 내가 기여한 잎만 금색으로 표시
export function myWeeklyGoldenIndicesInCell(dailyPrayersMap, myUid) {
  const indices = new Set();
  if (!myUid) return indices;
  const dates = Object.keys(dailyPrayersMap).sort();
  let running = 0;
  let myActiveDays = 0;
  dates.forEach((date) => {
    const uids = dailyPrayersMap[date] || [];
    const myPos = uids.indexOf(myUid);
    if (myPos !== -1) {
      myActiveDays += 1;
      if (myActiveDays % 7 === 0) indices.add(running + myPos);
    }
    running += uids.length;
  });
  return indices;
}
