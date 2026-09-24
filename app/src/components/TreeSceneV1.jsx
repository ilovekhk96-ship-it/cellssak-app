import { useMemo, useRef, useState } from 'react';
import { Sprout, Sparkles, Calendar } from 'lucide-react';
import { STATUS } from '../data/constants';
import { TRUNK_V1, BRANCHES_V1, ROOTS_V1, getLeafV1, leafSubpathDV1, getFruitV1 } from '../data/treeDataV1';
import { taperedCurve } from '../data/treeGen';
import { DECORATIONS, DECORATION_SLOTS } from '../data/decorations';
import CloudV1 from './CloudV1';
import ThoughtBubble from './ThoughtBubble';
import SceneIcon from './SceneIcon';
import HeartBadge from './HeartBadge';

// 버전1 — 사진이 아니라 좌표로 그리는 벡터 나무. 다른 버전들이 전부 png 이미지를 얹는 것과
// 달리 가지·잎·열매가 전부 SVG 도형이라 아무리 확대해도 안 깨지고 용량도 거의 안 든다.
// 화면 구성(구름·잔디·라벨·그림자·장식·핀치 줌)은 TreeSceneV6과 같은 구조를 그대로 따르고,
// 나무를 그리는 부분만 벡터로 바꿨다. v2~v6과 완전히 분리되어 있어 이 파일을 고쳐도
// 다른 버전에는 영향이 없다.
const GROUND_ANCHOR = { x: TRUNK_V1.x1, y: TRUNK_V1.y1 };
const LABEL_Y = GROUND_ANCHOR.y + 22;

function growthScale(score) {
  return 1 + Math.log2(1 + score / 40) * 0.35;
}

const MIN_USER_ZOOM = 0.6;
const MAX_USER_ZOOM = 4;

// 황금 나뭇잎 — 다른 버전은 잎이 이미지라 filter로 색을 틀지만, 여기는 도형이라 색만 바꾸면 된다
const GOLD_LEAF_FILL = '#E8C153';
const GOLD_LEAF_STROKE = 'rgba(120,86,16,0.5)';

// 밑동이 앉는 땅 — 뿌리가 뻗는 범위보다 넓어야 뿌리 끝이 잔디 밖 허공으로 나가 보이지 않는다
const GROUND = { rx: 58, ry: 9, fill: '#8FCB86', opacity: 0.55 };

// 잔디 — 다른 버전은 잔디도 사진(grass-1.png)을 여러 장 심지만, 버전1은 나무가 전부 도형이라
// 잔디만 사진이면 혼자 겉돈다. 풀잎 한 장을 가지·뿌리와 똑같은 함수(밑은 굵고 끝은 뾰족한
// 곡선)로 그려서 톤을 맞춘다. 배치 규칙(개수·간격·흔들림 지연)은 다른 버전과 동일
const GRASS_GREENS = ['#6FA66B', '#5E9659', '#7DB474'];

function makeClump(seed, height) {
  const n = 3 + (seed % 3); // 한 포기에 풀잎 3~5장
  return Array.from({ length: n }, (_, i) => {
    // 포기 안에서 왼쪽 끝 잎은 왼쪽으로, 오른쪽 끝 잎은 오른쪽으로 눕고 가운데는 곧게 선다
    const lean = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    const h = height * (0.62 + ((seed * (i + 3)) % 40) / 100);
    const tipX = lean * h * 0.55;
    return {
      // 제어점을 밑동 가까이 두면 아래쪽은 곧게 서 있다가 끝에서만 휘어 풀처럼 보인다
      d: taperedCurve(
        { x1: 0, y1: 0, cx: tipX * 0.25, cy: -h * 0.62, x2: tipX, y2: -h, w0: 2.1 + ((seed * (i + 7)) % 9) / 10, w1: 0.25 },
        7
      ),
      c: GRASS_GREENS[(seed + i) % GRASS_GREENS.length],
    };
  });
}

function makeGrassBlades(count, seed, height) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(45 + (i / (count - 1)) * 150 + (((i * 47 + seed) % 13) - 6)),
    y: ((i * 53 + seed) % 7) - 3,
    flip: (i * 7 + seed) % 3 !== 0,
    delay: -(((i * 41 + seed) % 320) / 100),
    clump: makeClump(i * 13 + seed + 1, height),
  }));
}
const GRASS_FRONT = makeGrassBlades(12, 0, 15);
const GRASS_BACK = makeGrassBlades(8, 5, 18);

function GrassRow({ blades, keyPrefix }) {
  return blades.map((g, i) => (
    <g key={`${keyPrefix}${i}`} transform={`translate(${g.x} ${GROUND_ANCHOR.y + 4 + g.y}) scale(${g.flip ? -1 : 1},1)`}>
      <g className="sway-grass" style={{ animationDelay: `${g.delay}s` }}>
        {g.clump.map((b, k) => (
          <path key={k} d={b.d} fill={b.c} />
        ))}
      </g>
    </g>
  ));
}

export default function TreeSceneV1({
  score,
  daysCount,
  todayActiveCount,
  seedCount,
  fruitCount,
  onOpenList,
  onOpenHeatmap,
  showActions = true,
  treeLabel,
  goldenIndices,
  equippedDecorations,
}) {
  // 잎 하나마다 채우기+테두리를 한 덩어리(path 하나)로 그리고, 나중에 생긴 잎일수록 나중에
  // 그려야 앞의 잎이 뒤의 잎 테두리를 자연스럽게 가린다
  const leafPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < score; i++) {
      const leaf = getLeafV1(i);
      arr.push({
        d: leafSubpathDV1(leaf.x, leaf.y, leaf.rot, leaf.scale),
        x: leaf.x,
        y: leaf.y,
        color: leaf.color,
        isGolden: goldenIndices ? goldenIndices.has(i) : false,
      });
    }
    return arr;
  }, [score, goldenIndices]);

  const visibleFruits = useMemo(() => {
    const arr = [];
    for (let i = 0; i < fruitCount; i++) arr.push(getFruitV1(i));
    return arr;
  }, [fruitCount]);

  const decorationItems = (equippedDecorations || [])
    .map((id) => {
      const deco = DECORATIONS.find((d) => d.id === id);
      const slot = deco && DECORATION_SLOTS.find((s) => s.id === deco.slot);
      return deco && slot ? { deco, slot } : null;
    })
    .filter(Boolean);

  const dayPct = Math.max(0, Math.min(100, Math.round((daysCount / 30) * 100)));

  const scale = useMemo(() => growthScale(score), [score]);

  const viewBox = useMemo(() => {
    let minX = 0, minY = 0, maxX = 240, maxY = 240;
    const consider = (x, y, pad = 0) => {
      minX = Math.min(minX, x - pad);
      minY = Math.min(minY, y - pad);
      maxX = Math.max(maxX, x + pad);
      maxY = Math.max(maxY, y + pad);
    };
    BRANCHES_V1.forEach((b) => {
      consider(b.x1, b.y1, b.w / 2);
      consider(b.x2, b.y2, b.w / 2);
    });
    ROOTS_V1.forEach((r) => {
      consider(r.x1, r.y1);
      consider(r.x2, r.y2);
    });
    leafPaths.forEach((l) => consider(l.x, l.y, 10));
    visibleFruits.forEach((f) => consider(f.x, f.y, 8));
    consider(-14, GROUND_ANCHOR.y, 0);
    consider(250, GROUND_ANCHOR.y, 0);

    const ax = GROUND_ANCHOR.x;
    const ay = GROUND_ANCHOR.y;
    const corners = [
      [minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY],
    ].map(([x, y]) => [ax + (x - ax) * scale, ay + (y - ay) * scale]);

    let vx0 = 0, vy0 = 0, vx1 = 240, vy1 = 240;
    corners.forEach(([x, y]) => {
      vx0 = Math.min(vx0, x);
      vy0 = Math.min(vy0, y);
      vx1 = Math.max(vx1, x);
      vy1 = Math.max(vy1, y);
    });
    if (treeLabel) vy1 = Math.max(vy1, ay + (LABEL_Y - ay) * scale + 16);
    const pad = 6;
    return `${vx0 - pad} ${vy0 - pad} ${vx1 - vx0 + pad * 2} ${vy1 - vy0 + pad * 2}`;
  }, [scale, leafPaths, visibleFruits, treeLabel]);

  const treeTransform = `translate(${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y}) scale(${scale}) translate(${-GROUND_ANCHOR.x} ${-GROUND_ANCHOR.y})`;

  const [userZoom, setUserZoom] = useState(1);
  const [interacting, setInteracting] = useState(false);
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const wheelIdleTimer = useRef(null);

  const clampZoom = (z) => Math.min(MAX_USER_ZOOM, Math.max(MIN_USER_ZOOM, z));

  const snapBack = () => {
    setInteracting(false);
    setUserZoom(1);
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      setInteracting(true);
      const [p1, p2] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), zoom: userZoom };
    }
  };

  const handlePointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinchStart.current || pointers.current.size !== 2) return;
    const [p1, p2] = [...pointers.current.values()];
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    setUserZoom(clampZoom(pinchStart.current.zoom * (dist / pinchStart.current.dist)));
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      pinchStart.current = null;
    }
    if (pointers.current.size === 0) {
      snapBack();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setInteracting(true);
    setUserZoom((z) => clampZoom(z * (1 - e.deltaY * 0.0015)));
    if (wheelIdleTimer.current) clearTimeout(wheelIdleTimer.current);
    wheelIdleTimer.current = setTimeout(snapBack, 350);
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: '480px',
        position: 'relative',
      }}
      className="flex flex-col"
    >
      <div style={{ top: '6%', left: '8%', zIndex: 0 }} className="drift-cloud">
        <CloudV1 w={44} />
      </div>
      <div style={{ top: '13%', right: '10%', zIndex: 0 }} className="drift-cloud">
        <CloudV1 w={32} />
      </div>

      <ThoughtBubble />

      <div
        className="flex-1 flex items-start justify-center w-full px-4"
        style={{ marginTop: '4px', position: 'relative', overflow: 'visible', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={handleWheel}
      >
        <svg
          viewBox={viewBox}
          style={{
            width: '92%',
            maxWidth: '300px',
            height: 'auto',
            transform: `scale(${userZoom})`,
            transition: interacting ? 'none' : 'transform 0.25s ease',
            willChange: 'transform',
          }}
        >
          {/* 지면 — 나무 확대 그룹 밖에 둬서 나무가 자라도 땅은 제자리에 있게 함 */}
          <ellipse
            cx={GROUND_ANCHOR.x}
            cy={GROUND_ANCHOR.y + 2}
            rx={GROUND.rx}
            ry={GROUND.ry}
            fill={GROUND.fill}
            opacity={GROUND.opacity}
          />

          <g transform={treeTransform} style={{ transition: 'transform 0.8s ease' }}>
            {/* 뒷줄 잔디 — 나무보다 먼저 그려서 밑동에 자연스럽게 가려짐 */}
            <GrassRow blades={GRASS_BACK} keyPrefix="gb" />

            {/* 뿌리를 가지보다 먼저 그려서, 밑동 쪽 끝이 기둥에 가려 파묻히게 함 */}
            {ROOTS_V1.map((r, i) => (
              <path key={`r${i}`} d={r.d} fill={r.c} />
            ))}

            <g className="sway-leaves">
              {/* 가지는 "밑은 굵고 끝은 가는" 채워진 도형 — 기둥도 그 목록의 첫 마디라 따로 안 그림 */}
              {BRANCHES_V1.map((b, i) => (
                <path key={`b${i}`} d={b.d} fill={b.c} />
              ))}

              {/* 잎은 자란 순서대로 — 나중에 자란 잎이 앞에 그려져야 겹쳐 자란 것처럼 보임 */}
              {leafPaths.map((l, i) => (
                <path
                  key={`l${i}`}
                  d={l.d}
                  fill={l.isGolden ? GOLD_LEAF_FILL : l.color}
                  stroke={l.isGolden ? GOLD_LEAF_STROKE : 'rgba(24,46,26,0.45)'}
                  strokeWidth="0.4"
                />
              ))}

              {/* 열매는 잎을 다 그린 뒤 맨 앞에 — 잎이 수백 장을 넘어가면 잎 뒤에 전부 깔려서
                  안 보였음. 믿음열매는 셀이 함께 축하하는 지표라 언제나 보여야 한다 */}
              {visibleFruits.map((f, k) => (
                <g key={`f${k}`}>
                  <circle cx={f.x} cy={f.y} r={f.r} fill={STATUS.fruit.color} stroke="#FFF6F0" strokeWidth="1" />
                  {/* 잎과 같은 방향(왼쪽 위)에서 빛을 받게 하이라이트를 찍어 동그랗게 보이게 함 */}
                  <circle cx={f.x - f.r * 0.3} cy={f.y - f.r * 0.35} r={f.r * 0.28} fill="#FFFFFF" opacity="0.55" />
                </g>
              ))}
            </g>

            {/* 앞줄 잔디 — 나무를 다 그린 뒤라 밑동 앞을 가려서 나무가 땅에 박힌 느낌을 준다 */}
            <GrassRow blades={GRASS_FRONT} keyPrefix="gf" />

            {decorationItems.map(({ deco, slot }) => (
              <text
                key={deco.id}
                x={slot.x}
                y={slot.y}
                textAnchor="middle"
                dominantBaseline="hanging"
                fontSize="20"
                style={{ pointerEvents: 'none' }}
              >
                {deco.emoji}
              </text>
            ))}

          </g>

          <g transform={treeTransform}>
            {treeLabel && (
              <text
                x={GROUND_ANCHOR.x}
                y={LABEL_Y}
                textAnchor="middle"
                fontSize="9"
                fill="#4A3B3F"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                paintOrder="stroke fill"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {treeLabel}
              </text>
            )}
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 px-6">
        <div style={{ width: '100%', maxWidth: '220px' }}>
          <p
            style={{
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              WebkitTextStroke: '3px #fff',
              paintOrder: 'stroke fill',
            }}
            className="text-xs font-bold text-center mb-1"
          >
            {daysCount}일째 기도중
          </p>
          <div style={{ position: 'relative' }}>
            <div style={{ background: '#FFFFFF66', height: '20px' }} className="rounded-full overflow-hidden">
              <div
                style={{
                  width: `${dayPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFD27A, #FF8A50, #F2555A)',
                  transition: 'width 0.6s ease',
                }}
                className="rounded-full"
              />
            </div>
            <span
              style={{
                position: 'absolute',
                left: `${Math.max(5, Math.min(95, dayPct))}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.6s ease',
                fontSize: '22px',
                lineHeight: 1,
              }}
            >
              🔥
            </span>
          </div>
        </div>
      </div>

      {showActions && (
        <div style={{ position: 'absolute', left: '14px', bottom: '18px' }} className="flex flex-col items-center gap-2.5">
          <SceneIcon icon={Sprout} label="기도씨앗" count={seedCount} bg="#FFFDF9" fg={STATUS.seed.color} onClick={() => onOpenList('seed')} />
          <SceneIcon icon={Sparkles} label="믿음열매" count={fruitCount} bg="#FFFDF9" fg={STATUS.fruit.color} onClick={() => onOpenList('fruit')} />
          {onOpenHeatmap && (
            <SceneIcon icon={Calendar} label="기도잔디" bg="#FFFDF9" fg="#4A9FD8" onClick={onOpenHeatmap} />
          )}
          <div style={{ marginTop: '6px' }}>
            <HeartBadge count={todayActiveCount} />
          </div>
        </div>
      )}
    </div>
  );
}
