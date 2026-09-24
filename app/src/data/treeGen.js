// 나무 뼈대(기둥/가지/뿌리) 생성.
//
// 예전 방식과의 결정적인 차이: 가지를 "굵기가 일정한 선"이 아니라 "밑은 굵고 끝은 가는
// 채워진 도형"으로 만든다. 선으로 그리면 아무리 여러 번 갈라도 굵기가 계단처럼 뚝뚝 끊기고,
// 잔가지가 전부 같은 두께라서 철사를 구부려 놓은 것 또는 빗자루처럼 보였다. 가지 한 마디가
// 부모의 끝 굵기를 그대로 이어받아 시작해서 제 끝까지 매끄럽게 가늘어지면 이음새가 사라지고,
// 참고 그림처럼 굵은 기둥에서 잔가지까지 하나의 흐름으로 이어진다.

const TRUNK_X = 120;
const GROUND_Y = 232;

// 뼈대는 기둥부터 잔가지·뿌리까지 전부 한 색이다. 굵기에 따라 색을 달리하면, 마디마다
// 따로 그린 도형들이 겹친 자리마다 색이 갈려서 나무에 판자를 덧대어 놓은 것처럼 보인다.
// 한 색으로 칠하면 겹친 도형들이 눈에는 하나의 실루엣으로 합쳐져서, 갈라지는 자리의
// 이음매가 아예 사라진다(참고 그림도 나무 전체가 한 톤이다)
const BARK = '#B2865B';

// 2차 베지어를 따라가며 굵기를 w0에서 w1로 줄여, 양옆으로 벌린 점들을 이어 닫힌 도형으로 만든다.
// steps는 윤곽을 몇 점으로 근사할지 — 짧은 잔가지는 적게, 길게 휘는 뿌리는 많이
// flatStart: 시작 쪽을 반원이 아니라 평평하게 자른다. 기둥에만 쓴다 — 기둥은 시작 반지름이
// 13이 넘어서 둥글게 마감하면 그만큼 지면 아래로 볼록 튀어나온 혹이 생긴다
export function taperedCurve(s, steps, flatStart = false) {
  const a = [];
  const b = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const px = mt * mt * s.x1 + 2 * mt * t * s.cx + t * t * s.x2;
    const py = mt * mt * s.y1 + 2 * mt * t * s.cy + t * t * s.y2;
    const dx = 2 * mt * (s.cx - s.x1) + 2 * t * (s.x2 - s.cx);
    const dy = 2 * mt * (s.cy - s.y1) + 2 * t * (s.y2 - s.cy);
    const len = Math.hypot(dx, dy) || 1;
    const hw = (s.w0 + (s.w1 - s.w0) * t) / 2;
    a.push([+(px - (dy / len) * hw).toFixed(1), +(py + (dx / len) * hw).toFixed(1)]);
    b.push([+(px + (dy / len) * hw).toFixed(1), +(py - (dx / len) * hw).toFixed(1)]);
  }
  // 양 끝을 평평하게 자르면, 각도가 꺾인 자식 가지가 붙는 자리에 배경색 삼각 홈이 남는다.
  // 반원으로 마감하면 어느 각도로 갈라지든 홈 없이 부모 몸통에 녹아든다
  b.reverse();
  const r0 = Math.max(0.05, s.w0 / 2);
  const r1 = Math.max(0.05, s.w1 / 2);
  const line = (list) => list.map(([x, y]) => `L${x},${y}`).join('');
  return (
    `M${a[0][0]},${a[0][1]}` +
    line(a.slice(1)) +
    `A${r1.toFixed(2)},${r1.toFixed(2)} 0 0 0 ${b[0][0]},${b[0][1]}` +
    line(b.slice(1)) +
    (flatStart ? `L${a[0][0]},${a[0][1]}Z` : `A${r0.toFixed(2)},${r0.toFixed(2)} 0 0 0 ${a[0][0]},${a[0][1]}Z`)
  );
}

export function generateTreeSkeleton(rand) {
  const branches = [];
  const roots = [];

  // 한 마디 뻗기. angleDeg는 0이 수직 위, 양수가 오른쪽.
  // 직선이 아니라 살짝 휘게 해야 가지가 뻣뻣해 보이지 않는다
  // backset: 시작점을 제 방향 반대로 이 만큼 물려서 그린다 — 자식 가지를 부모의 끝점에서
  // 딱 시작하면, 부모 끝면(평평하게 잘린 단면)과 각도가 꺾인 자식 사이에 V자 홈이 남아
  // 이음새가 눈에 띈다. 시작점을 부모 몸통 속으로 살짝 밀어 넣으면 두 도형이 겹쳐서
  // 홈이 메워지고 하나의 가지가 갈라지는 것처럼 매끄럽게 이어진다
  const grow = (x, y, angleDeg, length, w0, w1, backset = 0) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const sx = x - Math.cos(rad) * backset;
    const sy = y - Math.sin(rad) * backset;
    const x2 = x + Math.cos(rad) * length;
    const y2 = y + Math.sin(rad) * length;
    const span = length + backset;
    const nx = -(y2 - sy) / span;
    const ny = (x2 - sx) / span;
    const bow = (rand() - 0.5) * length * 0.26;
    branches.push({
      x1: sx, y1: sy, x2, y2,
      cx: (sx + x2) / 2 + nx * bow,
      cy: (sy + y2) / 2 + ny * bow,
      w0, w1,
      // w는 이 마디의 대표 굵기 — 잎이 붙을 만큼 가는 가지인지 고르는 기준으로도 쓰인다
      w: (w0 + w1) / 2,
    });
    return { x: x2, y: y2 };
  };

  // 갈라짐 — 한쪽은 원래 방향을 거의 이어받아 굵게(주지), 다른 한쪽은 크게 꺾이며 가늘게(측지).
  // 둘을 똑같이 갈라놓으면 완벽한 이진트리가 되어 어디를 봐도 같은 간격으로 가지가 뻗는
  // 규칙적인 부채/빗자루 모양이 된다
  // 굵기 감쇠는 단계마다 0.7 언저리여야 8단쯤 갈라진 뒤에 잔가지 굵기(0.6 정도)에 닿는다.
  // 더 빨리 줄이면 5단 만에 굵기가 바닥나 가지가 듬성듬성해지고, 더 늦추면 잔가지까지 굵어서
  // 나무가 산호처럼 보인다
  const SPREAD = 30;
  const fork = (x, y, angle, length, width, depth) => {
    const endW = width * 0.85;
    const p = grow(x, y, angle, length, width, endW, width * 0.55);
    if (depth <= 0 || endW < 0.5) return;
    const s = SPREAD * (0.68 + rand() * 0.64);
    const flip = rand() < 0.5 ? 1 : -1;
    // 갈라질 때마다 각도를 조금씩 위쪽(0도)으로 당긴다 — 실제 나무가 빛을 향해 끝을 치켜드는
    // 것과 같고, 이게 없으면 한번 바깥으로 꺾인 가지가 계속 같은 방향으로 달아나서 수관 밖으로
    // 혼자 길게 튀어나온 가지가 생긴다
    const up = (a) => Math.max(-108, Math.min(108, a * 0.93));
    // 굵기는 단면적이 보존되도록 나눈다(0.86² + 0.51² ≈ 1) — 주지를 부모 끝 굵기에 가깝게
    // 남겨야 기둥에서 잔가지까지 굵기가 한 줄기로 흐르고, 갈라지는 자리가 잘록해 보이지 않는다
    // 두 자식의 길이는 똑같이 줄인다 — 한쪽만 짧게 만들면 같은 단계의 가지 끝들이 제각각
    // 다른 거리에서 끝나서 수관 테두리가 들쭉날쭉해지고, 짧은 쪽 옆으로 긴 가지 하나가
    // 혼자 튀어나와 보인다. 굵기만 주지/측지로 다르고 길이는 비슷해야 테두리가 고르게 둥글다
    const childLen = length * (0.8 + rand() * 0.04);
    fork(p.x, p.y, up(angle - flip * s * 0.38), childLen, endW * 0.86, depth - 1);
    // 가끔 측지를 아예 내지 않아 성기게 만든다 — 늘 두 갈래면 잔가지가 다닥다닥 붙어 징그럽다
    if (rand() < 0.86) {
      fork(p.x, p.y, up(angle + flip * s * 0.84), childLen, endW * 0.51, depth - 1);
    }
  };

  // 수관은 기둥 꼭대기를 원점(0, 0)으로 하는 제 좌표계에서 먼저 만든다(-y가 위쪽).
  // 기둥과 수관을 한 덩어리로 만들어 마지막에 통째로 목표 높이에 맞춰 누르면, 기둥을 길게 할수록
  // 전체가 그만큼 더 눌려서 화면상 기둥 길이는 거의 그대로였다(원본 86 -> 화면 67, 134로 늘려도 85).
  // 수관만 따로 목표 크기에 맞추고 기둥 길이는 아래 상수로 직접 정하면, 가지 모양은 그대로 둔 채
  // 기둥 길이만 원하는 만큼 조절할 수 있다
  const TRUNK_W0 = 27;
  const TRUNK_W1 = 20;

  [
    { angle: -40, len: 34, wf: 0.6 },
    { angle: -6, len: 40, wf: 0.56 },
    { angle: 36, len: 33, wf: 0.6 },
  ].forEach((l) => {
    fork(0, 0, l.angle, l.len, TRUNK_W1 * l.wf, 8);
  });

  // 기둥 중간에서 옆으로 나가는 낮은 가지 둘 — 이게 없으면 수관이 기둥 위에 얹힌 버섯처럼 보인다.
  // 기둥을 셋으로 쪼개는 게 아니라 곁가지로 나가는 것이므로 가늘게 시작한다
  [
    { y: 16, angle: -58, len: 26, w: 8.2 },
    { y: 26, angle: 55, len: 28, w: 8.6 },
  ].forEach((l) => {
    fork(0, l.y, l.angle, l.len, l.w, 7);
  });

  // 뿌리 — 참고 그림처럼 밑동이 그대로 흘러내려 사방으로 넓게 퍼지는 판근(板根).
  // 가지와 똑같은 도형 함수를 써서 굵게 시작해 끝에서 뾰족하게 땅으로 사라진다.
  // x/y는 밑동에서 갈라져 나오는 자리, a는 각도(90=수평 오른쪽), arch는 지면 위로 솟는 높이
  [
    { x: -7, y: 26, a: -66, len: 44, w: 13, arch: 3 },
    { x: -6, y: 14, a: -80, len: 52, w: 12, arch: 5 },
    { x: -4, y: 5, a: -96, len: 40, w: 9, arch: 4 },
    { x: -2, y: 2, a: -114, len: 22, w: 6, arch: 2 },
    { x: 7, y: 24, a: 64, len: 46, w: 13, arch: 3 },
    { x: 6, y: 13, a: 78, len: 56, w: 12.5, arch: 5 },
    { x: 4, y: 5, a: 94, len: 43, w: 9.5, arch: 4 },
    { x: 2, y: 2, a: 112, len: 24, w: 6, arch: 2 },
  ].forEach((r) => {
    const x1 = TRUNK_X + r.x;
    const y1 = GROUND_Y - r.y;
    const rad = ((r.a - 90) * Math.PI) / 180;
    const x2 = x1 + Math.cos(rad) * r.len;
    // 끝은 언제나 지면 언저리 — 뿌리 끝이 땅속으로 파고들어 사라지는 것처럼 보이게 함
    const y2 = GROUND_Y + 0.5 + rand() * 2;
    roots.push({
      x1, y1, x2, y2,
      cx: x1 + (x2 - x1) * 0.55,
      cy: Math.max(y1, y2) - r.arch,
      w0: r.w, w1: 0.6,
      w: r.w,
    });
  });

  // 수관을 목표 크기(가로 폭·기둥 위로 솟는 높이)에 맞추고, 원점(0,0)이 기둥 꼭대기에
  // 오도록 옮긴다. 기둥 길이는 여기 상수 하나로 정해지고 수관 모양에는 영향을 주지 않는다
  const TRUNK_LEN = 116;
  const CANOPY_H = 146;
  const TARGET_HALF_WIDTH = 124;

  const cxs = branches.flatMap((b) => [b.x1, b.x2]);
  const cys = branches.flatMap((b) => [b.y1, b.y2]);
  const sx = TARGET_HALF_WIDTH / Math.max(Math.max(...cxs), -Math.min(...cxs));
  const sy = CANOPY_H / -Math.min(...cys);
  const JOIN_Y = GROUND_Y - TRUNK_LEN;
  const fx = (x) => TRUNK_X + x * sx;
  const fy = (y) => JOIN_Y + y * sy;

  // 도형(d)은 좌표 보정을 마친 뒤에 만들어야 굵기까지 같이 찌그러지지 않는다
  const shape = (s, steps, tx, ty, flatStart = false) => {
    const t = {
      x1: +tx(s.x1).toFixed(1), y1: +ty(s.y1).toFixed(1),
      x2: +tx(s.x2).toFixed(1), y2: +ty(s.y2).toFixed(1),
      cx: +tx(s.cx).toFixed(1), cy: +ty(s.cy).toFixed(1),
      w0: s.w0, w1: s.w1,
    };
    return {
      x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, cx: t.cx, cy: t.cy,
      w: +s.w.toFixed(2),
      c: BARK,
      d: taperedCurve(t, steps, flatStart),
    };
  };
  const same = (v) => v;

  // 기둥 — 이미 화면 좌표라 보정하지 않는다. 가지 목록 맨 앞에 넣어 가장 먼저(뒤에) 그린다
  const trunkSeg = {
    x1: TRUNK_X, y1: GROUND_Y, x2: TRUNK_X, y2: JOIN_Y,
    cx: TRUNK_X + 1.5, cy: (GROUND_Y + JOIN_Y) / 2,
    w0: TRUNK_W0, w1: TRUNK_W1, w: (TRUNK_W0 + TRUNK_W1) / 2,
  };

  return {
    // 나무가 땅에 붙어 있는 지점(밑동) — 이 점을 기준으로 나무 전체가 커지고 화면이 맞춰진다
    trunk: { x1: TRUNK_X, y1: GROUND_Y, x2: TRUNK_X, y2: JOIN_Y },
    branches: [shape(trunkSeg, 8, same, same, true), ...branches.map((b) => shape(b, 5, fx, fy))],
    roots: roots.map((r) => shape(r, 14, same, same)),
  };
}
