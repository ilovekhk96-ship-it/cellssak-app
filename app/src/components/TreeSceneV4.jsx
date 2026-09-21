import { useId, useMemo, useRef, useState } from 'react';
import { Sprout, Sparkles, Calendar } from 'lucide-react';
import { STATUS } from '../data/constants';
import { TREE_V4_IMAGE, getLeafV4, FRUIT_SPOTS_V4 } from '../data/treeDataV4';
import { DECORATIONS, DECORATION_SLOTS } from '../data/decorations';
import Cloud from './Cloud';
import ThoughtBubble from './ThoughtBubble';
import SceneIcon from './SceneIcon';
import HeartBadge from './HeartBadge';

// 버전4 실험용 TreeScene — 마인크래프트/복셀 스타일. 버전3(TreeSceneV3.jsx)와 완전히 같은
// 구조(가지 앵커 스캔, 앞/뒤 레이어, 줌/그림자 등)를 그대로 쓰고 이미지만 복셀 스타일로
// 교체함. v2, v3와 완전히 분리되어 있어 이 파일을 고쳐도 다른 버전에는 영향 없음.
const GROUND_ANCHOR = { x: 120, y: 232 };
const LABEL_Y = GROUND_ANCHOR.y + 22;

function growthScale(score) {
  return 1 + Math.log2(1 + score / 40) * 0.35;
}

const MIN_USER_ZOOM = 0.6;
const MAX_USER_ZOOM = 4;

const GOLD_LEAF_FILTER = 'sepia(1) hue-rotate(16deg) saturate(9) brightness(1.4)';

function makeGrassBlades(count, seed) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(45 + (i / (count - 1)) * 150 + (((i * 47 + seed) % 13) - 6)),
    y: ((i * 53 + seed) % 7) - 3,
    w: 16 + ((i * 29 + seed) % 16),
    flip: (i * 7 + seed) % 3 !== 0,
    delay: -(((i * 41 + seed) % 320) / 100),
  }));
}
const GRASS_FRONT = makeGrassBlades(12, 0);
const GRASS_BACK = makeGrassBlades(8, 5);

const GRASS_TUFT_IMAGES = ['/images/v4-minecraft/grass-voxel-a.png', '/images/v4-minecraft/grass-voxel-b.png'];

function GrassRow({ blades, height, keyPrefix }) {
  return blades.map((g, i) => (
    <g key={`${keyPrefix}${i}`} transform={`translate(${g.x} ${GROUND_ANCHOR.y + 4 + g.y}) scale(${g.flip ? -1 : 1},1)`}>
      <g className="sway-grass" style={{ animationDelay: `${g.delay}s` }}>
        <image href={GRASS_TUFT_IMAGES[i % GRASS_TUFT_IMAGES.length]} x={-g.w / 2} y={-height} width={g.w} height={height} preserveAspectRatio="xMidYMax meet" />
      </g>
    </g>
  ));
}

export default function TreeSceneV4({
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
  const shadowBlurId = `tree-shadow-blur-v4-${useId()}`;

  const leafPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < score; i++) {
      const leaf = getLeafV4(i);
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
  const visibleFruits = FRUIT_SPOTS_V4.slice(0, fruitCount);

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
    consider(TREE_V4_IMAGE.x, TREE_V4_IMAGE.y);
    consider(TREE_V4_IMAGE.x + TREE_V4_IMAGE.width, TREE_V4_IMAGE.y + TREE_V4_IMAGE.height);
    leafPaths.forEach((l) => consider(l.x, l.y, 40));
    visibleFruits.forEach((f) => consider(f.x, f.y + 18, 19));
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
    if (treeLabel) vy1 = Math.max(vy1, ay + (LABEL_Y - ay) * scale + 12);
    const pad = 6;
    return `${vx0 - pad} ${vy0 - pad} ${vx1 - vx0 + pad * 2} ${vy1 - vy0 + pad * 2}`;
  }, [scale, leafPaths, visibleFruits, treeLabel]);

  const treeTransform = `translate(${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y}) scale(${scale}) translate(${-GROUND_ANCHOR.x} ${-GROUND_ANCHOR.y})`;

  function renderGrowthItem(item) {
    if (item.type === 'leaf') {
      const l = item.leaf;
      const i = item.i;
      // 잎 블록 덩어리마다 원본 가로세로 비율이 달라서(정사각형 아님), 긴 쪽 기준으로
      // 크기를 맞춰야 뭉개지거나 늘어나 보이지 않음
      const nativeW = l.variant.w ?? 1;
      const nativeH = l.variant.h ?? 1;
      const target = 54 * l.scale;
      const longSide = Math.max(nativeW, nativeH);
      const w = (nativeW / longSide) * target;
      const h = (nativeH / longSide) * target;
      const ax = l.variant.anchorX ?? 0.5;
      const ay = l.variant.anchorY ?? 0.5;
      return (
        <g key={`l${i}`} transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}>
          <image
            href={l.variant.src}
            x={-w * ax}
            y={-h * ay}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid meet"
            style={l.isGolden ? { filter: GOLD_LEAF_FILTER } : undefined}
          />
        </g>
      );
    }
    const f = item.fruit;
    const k = item.k;
    const fw = 32;
    const fh = 34;
    // 포도(복셀) 사진도 꼭지가 이미지 맨 위쪽에 있어서, 꼭지를 가지 자리에 맞춰
    // 실제로 가지에서 아래로 드리운 것처럼 보이게 함
    return (
      <image
        key={`f${k}`}
        href="/images/v4-minecraft/grape-voxel.png"
        x={f.x - fw * 0.552}
        y={f.y}
        width={fw}
        height={fh}
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
        <Cloud src="/images/v4-minecraft/cloud-voxel-b-1.png" />
      </div>
      <div style={{ top: '17%', width: '44%', zIndex: 0, animationDuration: '400s', animationDelay: '-220s' }} className="drift-cloud">
        <Cloud src="/images/v4-minecraft/cloud-voxel-b-2.png" flip />
      </div>
      <div style={{ top: '38%', width: '26%', zIndex: 0, animationDuration: '370s', animationDelay: '-300s' }} className="drift-cloud">
        <Cloud src="/images/v4-minecraft/cloud-voxel-b-3.png" />
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
          <defs>
            <filter id={shadowBlurId} x="-60%" y="-150%" width="220%" height="400%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          <g>
            <g filter={`url(#${shadowBlurId})`}>
              <ellipse cx={GROUND_ANCHOR.x} cy={GROUND_ANCHOR.y + 5} rx={72} ry={11} fill="#1F3D22" opacity="0.2" />
              <ellipse cx={GROUND_ANCHOR.x} cy={GROUND_ANCHOR.y + 4} rx={38} ry={8} fill="#17301A" opacity="0.32" />
            </g>
          </g>

          <g transform={treeTransform} style={{ transition: 'transform 0.8s ease' }}>
            <GrassRow blades={GRASS_BACK} height={44} keyPrefix="gb" />

            {itemsBehind.map(renderGrowthItem)}

            <image
              href={TREE_V4_IMAGE.src}
              x={TREE_V4_IMAGE.x}
              y={TREE_V4_IMAGE.y}
              width={TREE_V4_IMAGE.width}
              height={TREE_V4_IMAGE.height}
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
          </g>

          <g transform={treeTransform}>
            <GrassRow blades={GRASS_FRONT} height={38} keyPrefix="gf" />

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
