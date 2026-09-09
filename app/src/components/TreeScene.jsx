import { useMemo, useRef, useState } from 'react';
import { Plus, Sprout, Sparkles } from 'lucide-react';
import { STATUS } from '../data/constants';
import { TRUNK, BRANCHES, FRUIT_SPOTS, getLeaf, leafSubpathD } from '../data/treeData';
import Cloud from './Cloud';
import ThoughtBubble from './ThoughtBubble';
import SceneIcon from './SceneIcon';
import HeartBadge from './HeartBadge';

// 나무가 서 있는 지면 지점(트렁크 아랫점) — 나무가 커질 때 이 점을 중심으로 확대되어야
// 실제로 뿌리 내린 자리에서 위로 자라나는 것처럼 보임
const GROUND_ANCHOR = { x: TRUNK.x1, y: TRUNK.y1 };

// score(누적 기도 일수)가 늘어날수록 나무가 실제로 커지는 느낌을 주되, 커질수록 증가폭은
// 점점 완만해지는 로그 곡선 — 실제 나무 성장처럼 초반엔 빠르게, 오래될수록 천천히 자람
function growthScale(score) {
  return 1 + Math.log2(1 + score / 40) * 0.35;
}

const MIN_USER_ZOOM = 0.6;
const MAX_USER_ZOOM = 4;

export default function TreeScene({ score, daysCount, todayActiveCount, seedCount, fruitCount, onAdd, onOpenList, showActions = true, treeLabel }) {
  // 잎 개수 제한 없음 — score(누적 기도 일수)만큼 절차적으로 생성.
  // 채우기와 테두리를 따로 그리면(색상별로 채우기 먼저, 테두리는 나중에 한번에) 뒤에 있어야 할
  // 잎의 테두리까지 앞에 있는 잎 위로 뚫고 나와서 죄다 겹쳐 보이는 문제가 있었음 — 잎 하나마다
  // 채우기+테두리를 한 덩어리(path 하나)로 그리고, 나중에 생긴 잎일수록 나중에(맨 앞에) 그려야
  // 실제로 겹쳐 자란 잎처럼 앞의 잎이 뒤의 잎 테두리를 자연스럽게 가림
  const leafPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < score; i++) {
      const leaf = getLeaf(i);
      arr.push({ d: leafSubpathD(leaf.x, leaf.y, leaf.rot, leaf.scale), x: leaf.x, y: leaf.y, color: leaf.color });
    }
    return arr;
  }, [score]);
  const visibleFruits = FRUIT_SPOTS.slice(0, fruitCount);
  const dayPct = Math.max(0, Math.min(100, Math.round((daysCount / 30) * 100)));

  const scale = useMemo(() => growthScale(score), [score]);

  // 나무가 지면 지점을 중심으로 scale배 커졌을 때, 그 전체가 화면(viewBox) 안에 들어오도록
  // 필요한 만큼만 자동으로 줌아웃 — 나무가 작을 땐 원래 프레임(0 0 240 240) 그대로 유지됨
  const viewBox = useMemo(() => {
    let minX = 0, minY = 0, maxX = 240, maxY = 240;
    const consider = (x, y, pad = 0) => {
      minX = Math.min(minX, x - pad);
      minY = Math.min(minY, y - pad);
      maxX = Math.max(maxX, x + pad);
      maxY = Math.max(maxY, y + pad);
    };
    consider(TRUNK.x1, TRUNK.y1);
    consider(TRUNK.x2, TRUNK.y2);
    BRANCHES.forEach((b) => {
      consider(b.x1, b.y1);
      consider(b.x2, b.y2);
    });
    leafPaths.forEach((l) => consider(l.x, l.y, 6));
    visibleFruits.forEach((f) => consider(f.x, f.y, 6));

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
    const pad = 6;
    return `${vx0 - pad} ${vy0 - pad} ${vx1 - vx0 + pad * 2} ${vy1 - vy0 + pad * 2}`;
  }, [scale, leafPaths, visibleFruits]);

  const treeTransform = `translate(${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y}) scale(${scale}) translate(${-GROUND_ANCHOR.x} ${-GROUND_ANCHOR.y})`;

  // 사용자가 손가락(핀치)이나 마우스 휠로 잠깐 확대·축소해서 자세히 볼 수 있게 함 — 나무를
  // 드래그로 옮기는 기능은 없음(줌만). 손을 떼거나 휠 조작을 멈추면 자동으로 원래 배율로
  // 스르륵 돌아옴. 자동으로 계산되는 위 viewBox/scale과는 별개로 잠깐 얹는 값
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
      <div style={{ position: 'absolute', top: '6%', left: '8%' }} className="drift-cloud">
        <Cloud w={44} />
      </div>
      <div style={{ position: 'absolute', top: '13%', right: '10%' }} className="drift-cloud">
        <Cloud w={32} />
      </div>

      <ThoughtBubble />

      <div
        className="flex-1 flex items-center justify-center w-full px-4"
        style={{ marginTop: '4px', position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={handleWheel}
      >
        <svg
          viewBox={viewBox}
          style={{
            width: '86%',
            maxWidth: '260px',
            height: 'auto',
            transform: `scale(${userZoom})`,
            transition: interacting ? 'none' : 'transform 0.25s ease',
          }}
        >
          <ellipse cx="119" cy="234" rx="46" ry="8" fill="#8FCB86" opacity="0.55" />

          <g transform={treeTransform} style={{ transition: 'transform 0.8s ease' }}>
            <line x1={TRUNK.x1} y1={TRUNK.y1} x2={TRUNK.x2} y2={TRUNK.y2} stroke={TRUNK.c} strokeWidth={TRUNK.w} strokeLinecap="round" />

            <g className="sway-leaves">
              {BRANCHES.map((b, i) => (
                <line key={`b${i}`} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={b.c} strokeWidth={b.w} strokeLinecap="round" />
              ))}
              {leafPaths.map((l, i) => (
                <path key={i} d={l.d} fill={l.color} stroke="rgba(24,46,26,0.45)" strokeWidth="0.4" />
              ))}
              {visibleFruits.map((f, i) => (
                <circle key={`f${i}`} cx={f.x} cy={f.y} r="5.5" fill={STATUS.fruit.color} stroke="#FFF6F0" strokeWidth="1" />
              ))}
            </g>
          </g>

          {treeLabel && (
            <text
              x={GROUND_ANCHOR.x}
              y={GROUND_ANCHOR.y + 12}
              textAnchor="middle"
              fontSize="9"
              style={{ fontFamily: 'var(--font-display)', fill: 'var(--ink-soft)' }}
            >
              {treeLabel}
            </text>
          )}
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 px-6">
        <div style={{ width: '100%', maxWidth: '220px' }}>
          <p style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }} className="text-xs font-bold text-center mb-1">
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
          <SceneIcon icon={Plus} label="추가" bg="var(--ink)" fg="#FFF8F0" onClick={onAdd} />
          <SceneIcon icon={Sprout} label="기도씨앗" count={seedCount} bg="#FFFDF9" fg={STATUS.seed.color} onClick={() => onOpenList('seed')} />
          <SceneIcon icon={Sparkles} label="믿음열매" count={fruitCount} bg="#FFFDF9" fg={STATUS.fruit.color} onClick={() => onOpenList('fruit')} />
          <div style={{ marginTop: '6px' }}>
            <HeartBadge count={todayActiveCount} />
          </div>
        </div>
      )}
    </div>
  );
}
