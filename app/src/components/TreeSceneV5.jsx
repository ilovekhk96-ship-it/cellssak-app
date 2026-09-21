import { useId, useMemo, useRef, useState } from 'react';
import { Sprout, Sparkles, Calendar } from 'lucide-react';
import { STATUS } from '../data/constants';
import { TREE_V5_IMAGE, getLeafV5, FRUIT_SPOTS_V5 } from '../data/treeDataV5';
import { DECORATIONS, DECORATION_SLOTS } from '../data/decorations';
import Cloud from './Cloud';
import ThoughtBubble from './ThoughtBubble';
import SceneIcon from './SceneIcon';
import HeartBadge from './HeartBadge';

// 버전5 실험용 TreeScene — 픽셀아트(포켓몬 스타일). 버전3(TreeSceneV3.jsx)와 완전히 같은
// 구조(가지 앵커 스캔, 잎마다 줄기 각도 감지해서 가지 방향으로 회전, 줌/그림자 등)를
// 그대로 쓰고 이미지만 픽셀아트 스타일로 교체함. v2/v3/v4와 완전히 분리되어 있어 이
// 파일을 고쳐도 다른 버전에는 영향 없음.
const GROUND_ANCHOR = { x: 120, y: 232 };
const LABEL_Y = GROUND_ANCHOR.y + 22;

function growthScale(score) {
  return 1 + Math.log2(1 + score / 40) * 0.35;
}

const MIN_USER_ZOOM = 0.6;
const MAX_USER_ZOOM = 4;

const GOLD_LEAF_FILTER = 'sepia(1) hue-rotate(16deg) saturate(9) brightness(1.4)';

const GRAPE_VARIANTS = [
  { src: '/images/v5-pixel/grape-a-pixel.png', ax: 0.4983, ay: 0.0138, w: 16, h: 19 },
  { src: '/images/v5-pixel/grape-b-pixel.png', ax: 0.5596, ay: 0.0108, w: 16, h: 17 },
];

const CLOUD_IMAGES_V5 = [
  '/images/v5-pixel/clouds/cloud-p-01.png',
  '/images/v5-pixel/clouds/cloud-p-04.png',
  '/images/v5-pixel/clouds/cloud-p-07.png',
];

function makeGrassBlades(count, seed) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(-8 + (i / (count - 1)) * 256 + (((i * 47 + seed) % 13) - 6)),
    y: ((i * 53 + seed) % 7) - 3,
    w: 11 + ((i * 29 + seed) % 11),
    flip: (i * 7 + seed) % 3 !== 0,
    delay: -(((i * 41 + seed) % 320) / 100),
  }));
}
const GRASS_FRONT = makeGrassBlades(12, 0);
const GRASS_BACK = makeGrassBlades(8, 5);

function GrassRow({ blades, height, keyPrefix }) {
  return blades.map((g, i) => (
    <g key={`${keyPrefix}${i}`} transform={`translate(${g.x} ${GROUND_ANCHOR.y + 4 + g.y}) scale(${g.flip ? -1 : 1},1)`}>
      <g className="sway-grass" style={{ animationDelay: `${g.delay}s` }}>
        <image href="/images/v5-pixel/grass-pixel.png" x={-g.w / 2} y={-height} width={g.w} height={height} preserveAspectRatio="xMidYMax meet" />
      </g>
    </g>
  ));
}

export default function TreeSceneV5({
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
  const shadowBlurId = `tree-shadow-blur-v5-${useId()}`;

  const leafPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < score; i++) {
      const leaf = getLeafV5(i);
      const isGolden = goldenIndices && goldenIndices.has(i);
      arr.push({
        x: leaf.x,
        y: leaf.y,
        rot: leaf.rot,
        scale: leaf.scale,
        variant: leaf.variant,
        isGolden,
        behind: leaf.behind,
      });
    }
    return arr;
  }, [score, goldenIndices]);
  const visibleFruits = FRUIT_SPOTS_V5.slice(0, fruitCount);

  const decorationItems = (equippedDecorations || [])
    .map((id) => {
      const deco = DECORATIONS.find((d) => d.id === id);
      const slot = deco && DECORATION_SLOTS.find((s) => s.id === deco.slot);
      return deco && slot ? { deco, slot } : null;
    })
    .filter(Boolean);

  const { itemsBehind, itemsFront } = useMemo(() => {
    const all = leafPaths.map((l, i) => ({ type: 'leaf', order: i, leaf: l, i }));
    visibleFruits.forEach((f, k) => {
      all.push({ type: 'fruit', order: ((k + 1) / (fruitCount + 1)) * score, fruit: f, k });
    });
    all.sort((a, b) => a.order - b.order);
    const behind = [];
    const front = [];
    for (const item of all) {
      const isBehind = item.type === 'leaf' ? item.leaf.behind : item.fruit.behind;
      (isBehind ? behind : front).push(item);
    }
    return { itemsBehind: behind, itemsFront: front };
  }, [leafPaths, visibleFruits, fruitCount, score]);

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
    consider(TREE_V5_IMAGE.x, TREE_V5_IMAGE.y);
    consider(TREE_V5_IMAGE.x + TREE_V5_IMAGE.width, TREE_V5_IMAGE.y + TREE_V5_IMAGE.height);
    leafPaths.forEach((l) => consider(l.x, l.y, 17));
    visibleFruits.forEach((f) => consider(f.x, f.y + 9, 9));

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
    vx0 = Math.min(vx0, -14);
    vx1 = Math.max(vx1, 250);
    const pad = 6;
    return `${vx0 - pad} ${vy0 - pad} ${vx1 - vx0 + pad * 2} ${vy1 - vy0 + pad * 2}`;
  }, [scale, leafPaths, visibleFruits, treeLabel]);

  const treeTransform = `translate(${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y}) scale(${scale}) translate(${-GROUND_ANCHOR.x} ${-GROUND_ANCHOR.y})`;

  function renderGrowthItem(item) {
    if (item.type === 'leaf') {
      const l = item.leaf;
      const i = item.i;
      const w = 20 * l.scale;
      const h = 20 * l.scale;
      const ax = l.variant.anchorX ?? 0.5;
      const ay = l.variant.anchorY ?? 0.5;
      return (
        <g key={`l${i}`} transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}>
          <g style={l.isGolden ? { filter: GOLD_LEAF_FILTER } : undefined}>
            <image href={l.variant.src} x={-w * ax} y={-h * ay} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>
      );
    }
    const f = item.fruit;
    const k = item.k;
    const g = GRAPE_VARIANTS[k % GRAPE_VARIANTS.length];
    return (
      <image
        key={`f${k}`}
        href={g.src}
        x={f.x - g.w * g.ax}
        y={f.y}
        width={g.w}
        height={g.h}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

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
      <div style={{ top: '-8%', width: '56%', zIndex: 0, animationDuration: '340s' }} className="drift-cloud">
        <Cloud src={CLOUD_IMAGES_V5[0]} />
      </div>
      <div style={{ top: '17%', width: '44%', zIndex: 0, animationDuration: '400s', animationDelay: '-220s' }} className="drift-cloud">
        <Cloud src={CLOUD_IMAGES_V5[1]} flip />
      </div>
      <div style={{ top: '38%', width: '26%', zIndex: 0, animationDuration: '370s', animationDelay: '-300s' }} className="drift-cloud">
        <Cloud src={CLOUD_IMAGES_V5[2]} />
      </div>

      <ThoughtBubble />

      <div
        className="flex-1 flex items-center justify-center w-full px-4"
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
          <defs>
            <filter id={shadowBlurId} x="-60%" y="-150%" width="220%" height="400%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          <g transform={`rotate(10 ${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y})`} filter={`url(#${shadowBlurId})`}>
            <ellipse cx={GROUND_ANCHOR.x + 60} cy={GROUND_ANCHOR.y + 2} rx={100} ry={11} fill="#1F3D22" opacity="0.17" />
            <ellipse cx={GROUND_ANCHOR.x + 18} cy={GROUND_ANCHOR.y + 1} rx={46} ry={9} fill="#17301A" opacity="0.28" />
          </g>

          <g transform={treeTransform} style={{ transition: 'transform 0.8s ease' }}>
            {itemsBehind.map(renderGrowthItem)}

            <image
              href={TREE_V5_IMAGE.src}
              x={TREE_V5_IMAGE.x}
              y={TREE_V5_IMAGE.y}
              width={TREE_V5_IMAGE.width}
              height={TREE_V5_IMAGE.height}
              preserveAspectRatio="xMidYMax meet"
            />

            {itemsFront.map(renderGrowthItem)}

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

            <GrassRow blades={GRASS_BACK} height={30} keyPrefix="gb" />
            <GrassRow blades={GRASS_FRONT} height={26} keyPrefix="gf" />
          </g>

          {treeLabel && (
            <text
              x={GROUND_ANCHOR.x}
              y={GROUND_ANCHOR.y + (LABEL_Y - GROUND_ANCHOR.y) * scale}
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
