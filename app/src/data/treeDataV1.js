// 인덱스/시드만으로 항상 같은 값이 나오는 결정론적 랜덤 — 나무 구조(가지)도, 잎/열매 배치도
// 전부 이 함수로만 만들어서 언제 다시 계산해도 같은 나무가 나오게 함
function seededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { generateTreeSkeleton } from './treeGen';

const SKELETON = generateTreeSkeleton(seededRandom(20260924));
export const TRUNK_V1 = SKELETON.trunk;
export const BRANCHES_V1 = SKELETON.branches;
export const ROOTS_V1 = SKELETON.roots;

// 가지 끝을 배열 순서 그대로 쓰면 같은 잔가지 묶음이 연달아 나와서 잎이 한쪽 구석에만 뭉쳐 자람 —
// 고정된 시드로 한 번 섞어두면 잎이 적을 때도 나무 전체에 고르게 퍼져 보임
function shuffledAnchors(list) {
  const arr = [...list];
  const rand = seededRandom(20260904);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 잎이 자라날 수 있는 위치 — 잔가지 + 그보다 두 단계 굵은 가지까지, 가지 끝 1곳이 아니라
// 길이를 따라 3곳(중간~끝)에 각각 앵커를 둠. 잎이 많아지면 같은 앵커에 반복해서 쌓이는데,
// 앵커 자체가 3배 많아지면 그만큼 반복 주기가 늦게 와서 "같은 자리에 겹친" 느낌이 덜함.
// 트렁크에 바로 붙은 가장 굵은 가지(6~10대)에는 잎을 붙이지 않아야 이끼처럼 뭉치지 않고
// 실제 나무처럼 가장자리 위주로 무성해짐. angle은 그 가지가 자라난 방향(도) — 잎이 그 방향을 향하게 함
const ANCHOR_POSITIONS_ALONG_BRANCH = [0.5, 0.75, 1];
// 섞는 단위가 앵커가 아니라 가지라는 점이 중요함 — 앵커를 통째로 섞으면 잎이 한 장씩 나무
// 여기저기에 뚝뚝 떨어져 붙어서, 특히 잎이 몇 장 없을 때 허공에 잎 한 장이 혼자 튀어나온 것처럼
// 보인다. 가지 단위로 섞고 한 가지에 달린 앵커 3개는 붙여 두면, 잎이 3장만 있어도 한 가지에
// 모여 돋은 새순처럼 보이고 그다음 가지로 옮겨 간다
const LEAF_ANCHORS = shuffledAnchors(BRANCHES_V1.filter((b) => b.w <= 2.5)).flatMap((b) => {
  const angle = (Math.atan2(b.y2 - b.y1, b.x2 - b.x1) * 180) / Math.PI;
  return ANCHOR_POSITIONS_ALONG_BRANCH.map((t) => ({
    x: b.x1 + (b.x2 - b.x1) * t,
    y: b.y1 + (b.y2 - b.y1) * t,
    angle,
  }));
});

// 진하고 채도 있는 초록 계열 — 배경 잔디색(#A8DE9D)과 안 헷갈리게 그보다 어둡고 선명한 색만 사용.
// 밝은 순서로 나열해둔 것이 중요함: 잎 색을 무작위로 고르면 잎이 수천 장 될 때 값이 골고루 섞여
// 평균값 하나짜리 단색 덩어리로 보이는데, 잎이 놓인 위치로 이 배열의 앞(빛)/뒤(그늘)를 골라주면
// 수관에 명암이 생겨서 잎이 꽉 차도 부피감이 남음
const LEAF_COLORS = [
  '#7CBB64', '#6BAE58', '#5CA359', '#519650',
  '#478A47', '#3E7A41', '#356B3B', '#2E5D34',
];

// 빛이 들어오는 방향(왼쪽 위) — 이 방향에 가까운 잎일수록 LEAF_COLORS 앞쪽(밝은) 색을 씀
const LIGHT_DIR = (() => {
  const x = -0.45;
  const y = -1;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
})();

// 잎이 붙을 수 있는 범위(=수관)의 크기 — 잎 위치를 -1~1로 정규화해서 명암을 매기는 기준.
// 나무 뼈대가 바뀌어도 다시 계산되도록 앵커에서 직접 구함
const CANOPY = (() => {
  const xs = LEAF_ANCHORS.map((a) => a.x);
  const ys = LEAF_ANCHORS.map((a) => a.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    halfW: Math.max(1, (x1 - x0) / 2),
    halfH: Math.max(1, (y1 - y0) / 2),
  };
})();

// 잎 한 장의 색 — 빛 방향에서 얼마나 떨어져 있는지(0=가장 밝은 쪽, 1=가장 그늘진 쪽)로 고르되,
// 잎마다 조금씩 흔들어서(noise) 명암 경계가 띠처럼 딱 잘려 보이지 않게 함
function leafColorAt(x, y, noise) {
  const u =
    ((x - CANOPY.cx) / CANOPY.halfW) * LIGHT_DIR.x +
    ((y - CANOPY.cy) / CANOPY.halfH) * LIGHT_DIR.y;
  const shade = (1 - u) / 2 + (noise - 0.5) * 0.34;
  const i = Math.round(Math.max(0, Math.min(1, shade)) * (LEAF_COLORS.length - 1));
  return LEAF_COLORS[i];
}

// score(지금까지 기도한 총 인원-일수)번째 잎의 위치·색·회전·크기 — 개수 제한 없이 몇 번째든 계산 가능
export function getLeafV1(index) {
  const anchor = LEAF_ANCHORS[index % LEAF_ANCHORS.length];
  const ring = Math.floor(index / LEAF_ANCHORS.length); // 같은 앵커에 몇 번째로 덧붙는 잎인지
  const rand = seededRandom(index * 2654435761 + 1);
  const anchorAngleRad = (anchor.angle * Math.PI) / 180;
  let jitterAngle;
  let radius;
  if (ring === 0) {
    // 첫 바퀴: 가지 끝 주변 아무 방향에나 자연스럽게 한 장씩
    jitterAngle = rand() * Math.PI * 2;
    radius = 3 + rand() * 2.5;
  } else {
    // 그 다음부터는 나무가 가지를 실제로 뻗는 것처럼, 가지가 자란 방향 쪽으로 계속 더 뻗어나가며
    // 잎이 붙게 함 — 그래야 같은 자리에 잎이 겹겹이 쌓이는 대신 가지 끝이 점점 무성하게 자라 보임
    jitterAngle = anchorAngleRad + (rand() - 0.5) * Math.PI * 0.9;
    radius = 5 + Math.min(ring * 1.1, 18) + rand() * 3;
  }
  // 잎의 뾰족한 끝이 가지가 자란 방향을 향하되, 한 가지에서도 잎마다 조금씩 방향이 퍼지도록 함
  const rot = anchor.angle + 90 + (rand() - 0.5) * 100;
  const x = anchor.x + Math.cos(jitterAngle) * radius;
  const y = anchor.y + Math.sin(jitterAngle) * radius * 0.85;
  return {
    x,
    y,
    rot,
    scale: 0.78 + rand() * 0.55,
    color: leafColorAt(x, y, rand()),
  };
}

// 잎 도형의 좌표점들 (M 시작점 + 4개 곡선 × 3점) — 위쪽이 뾰족하고 아래쪽이 둥근 나뭇잎 모양.
// 잎 하나를 회전·크기·이동 적용한 좌표로 직접 변환할 때 사용
const LEAF_POINTS = [
  [0, -9],
  [2.2, -6], [3.8, -1.3], [3.5, 2.4],
  [3.1, 5.2], [1.8, 7.3], [0, 8],
  [-1.8, 7.3], [-3.1, 5.2], [-3.5, 2.4],
  [-3.8, -1.3], [-2.2, -6], [0, -9],
];

// 잎 하나를 (x,y,rot,scale)만큼 변환한 SVG path 좌표 문자열로 만듦 — 같은 색 잎끼리 하나의 <path>로 합쳐 그리기 위한 용도
// (잎이 수천 장이어도 DOM 엘리먼트는 색상 개수만큼만 생기게 해서 성능 문제 없이 렌더링됨)
export function leafSubpathDV1(x, y, rot, scale) {
  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pts = LEAF_POINTS.map(([px, py]) => {
    const sx = px * scale;
    const sy = py * scale;
    const rx = sx * cos - sy * sin + x;
    const ry = sx * sin + sy * cos + y;
    return `${rx.toFixed(2)},${ry.toFixed(2)}`;
  });
  return `M${pts[0]} C${pts[1]} ${pts[2]} ${pts[3]} C${pts[4]} ${pts[5]} ${pts[6]} C${pts[7]} ${pts[8]} ${pts[9]} C${pts[10]} ${pts[11]} ${pts[12]} Z `;
}

// 열매 자리 — 가장 가느다란(끝) 가지들의 끝점을 그대로 가져다 씀(하드코딩된 좌표 목록 대신
// BRANCHES에서 직접 뽑아서, 나무 뼈대가 바뀌어도 항상 실제 가지 끝과 맞아떨어지게 함)
const FRUIT_SPOTS = BRANCHES_V1.filter((b) => b.w <= 1.6).map((b) => ({ x: b.x2, y: b.y2 }));

// 열매 자리를 배열 순서 그대로 앞에서부터 채우면(파일에 적힌 순서가 원래 가지 순회 순서라)
// 특정 구역에만 몰려서 자람 — 잎과 같은 방식으로 고정 시드로 한 번 섞어서 몇 개가 자라든
// 나무 전체에 고르게 퍼지게 함
const FRUIT_ANCHORS = shuffledAnchors(FRUIT_SPOTS);

// score(index)번째 열매의 위치·크기 — 정확히 가지 끝 좌표에 딱 붙으면 다닥다닥 뭉친 구슬처럼
// 보여서, 잎처럼 앵커 주변에 살짝 흩뿌리고 크기도 조금씩 다르게 줘서 실제 매달린 열매처럼 보이게 함
export function getFruitV1(index) {
  const anchor = FRUIT_ANCHORS[index % FRUIT_ANCHORS.length];
  const rand = seededRandom(index * 40503 + 7);
  const jitterAngle = rand() * Math.PI * 2;
  const radius = rand() * 3.4;
  return {
    x: anchor.x + Math.cos(jitterAngle) * radius,
    y: anchor.y + Math.sin(jitterAngle) * radius * 0.85,
    r: 4.4 + rand() * 2.0,
  };
}
