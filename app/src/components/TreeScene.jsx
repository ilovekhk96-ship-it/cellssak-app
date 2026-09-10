import { useId, useMemo, useRef, useState } from 'react';
import { Sprout, Sparkles } from 'lucide-react';
import { STATUS } from '../data/constants';
import { TRUNK, BRANCHES, FRUIT_SPOTS, getLeaf } from '../data/treeData';
import Cloud from './Cloud';
import ThoughtBubble from './ThoughtBubble';
import SceneIcon from './SceneIcon';
import HeartBadge from './HeartBadge';

// 나무가 서 있는 지면 지점(트렁크 아랫점) — 나무가 커질 때 이 점을 중심으로 확대되어야
// 실제로 뿌리 내린 자리에서 위로 자라나는 것처럼 보임
const GROUND_ANCHOR = { x: TRUNK.x1, y: TRUNK.y1 };

// 나무 이름표(treeLabel) 위치 — 땅(트렁크 밑동) 바로 밑
const LABEL_Y = GROUND_ANCHOR.y + 22;

// score(누적 기도 일수)가 늘어날수록 나무가 실제로 커지는 느낌을 주되, 커질수록 증가폭은
// 점점 완만해지는 로그 곡선 — 실제 나무 성장처럼 초반엔 빠르게, 오래될수록 천천히 자람
function growthScale(score) {
  return 1 + Math.log2(1 + score / 40) * 0.35;
}

const MIN_USER_ZOOM = 0.6;
const MAX_USER_ZOOM = 4;

// 실사 잎 사진 2종을 잎마다 번갈아 사용 — 벡터 색상 대신 사진이라 golden은 필터로 색을 입힘
const LEAF_IMAGES = ['/images/leaf-1.png', '/images/leaf-2.png'];
const GOLD_LEAF_FILTER = 'sepia(1) saturate(6) hue-rotate(-10deg) brightness(1.05)';

// 나무 발치뿐 아니라 기본 화면 폭(0~240) 전체에 촘촘히 깔아서 사방이 잔디로 덮인
// 느낌을 줌 — 폭을 너무 늘리면 viewBox가 넓어져 나무가 상대적으로 작아 보이므로,
// 넓게 퍼뜨리기보다 기존 프레임 안에서 개수를 늘려 밀도로 "많다"는 느낌을 줌.
// scale/성장과 무관하게 땅에 고정된 위치·크기. seed를 다르게 줘서 앞줄/뒷줄이
// 같은 자리에 안 겹치도록 함
function makeGrassBlades(count, seed) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(-8 + (i / (count - 1)) * 256 + (((i * 47 + seed) % 13) - 6)),
    y: ((i * 53 + seed) % 7) - 3,
    w: 11 + ((i * 29 + seed) % 11),
    flip: (i * 7 + seed) % 3 !== 0,
    delay: -(((i * 41 + seed) % 320) / 100),
  }));
}
// 앞줄: 나무보다 나중에 그려서 밑동을 살짝 덮음 — 키를 낮게 둬서 나무를 가리지 않음.
// 너무 빽빽해서 그림자까지 덮어버리길래 절반 수준으로 줄임
const GRASS_FRONT = makeGrassBlades(34, 0);
// 뒷줄: 나무보다 먼저 그려서 줄기·가지에 자연스럽게 가려지며 깊이감을 줌
const GRASS_BACK = makeGrassBlades(24, 5);

function GrassRow({ blades, height, keyPrefix }) {
  return blades.map((g, i) => (
    <g key={`${keyPrefix}${i}`} transform={`translate(${g.x} ${GROUND_ANCHOR.y + 4 + g.y}) scale(${g.flip ? -1 : 1},1)`}>
      <g className="sway-grass" style={{ animationDelay: `${g.delay}s` }}>
        <image href="/images/grass-1.png" x={-g.w / 2} y={-height} width={g.w} height={height} preserveAspectRatio="xMidYMax meet" />
      </g>
    </g>
  ));
}

export default function TreeScene({ score, daysCount, todayActiveCount, seedCount, fruitCount, onOpenList, showActions = true, treeLabel, goldenIndices }) {
  // 나무 그림자 블러 필터 id — 화면에 TreeScene이 동시에 여러 개 떠도(예: 추후 비교 화면)
  // id가 겹치지 않도록 컴포넌트 인스턴스마다 고유하게 생성
  const shadowBlurId = `tree-shadow-blur-${useId()}`;

  // 잎 개수 제한 없음 — score(누적 기도 일수)만큼 절차적으로 생성.
  // 채우기와 테두리를 따로 그리면(색상별로 채우기 먼저, 테두리는 나중에 한번에) 뒤에 있어야 할
  // 잎의 테두리까지 앞에 있는 잎 위로 뚫고 나와서 죄다 겹쳐 보이는 문제가 있었음 — 잎 하나마다
  // 채우기+테두리를 한 덩어리(path 하나)로 그리고, 나중에 생긴 잎일수록 나중에(맨 앞에) 그려야
  // 실제로 겹쳐 자란 잎처럼 앞의 잎이 뒤의 잎 테두리를 자연스럽게 가림
  const leafPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < score; i++) {
      const leaf = getLeaf(i);
      // goldenIndices에 들어있는 인덱스만 황금 잎 — "몇 번째 잎인지"가 아니라 "누구의 몇 번째
      // 활동일인지"를 바깥(App.jsx/PersonalHome.jsx)에서 미리 계산해서 넘겨줌. 셀 나무처럼 여러
      // 사람 몫이 섞여 쌓이는 경우, 단순히 7번째 잎마다 금색으로 하면 "셀 전체가 7번째"가 되어
      // 버려서 "나"의 일주일 기준과 안 맞기 때문
      const isGolden = goldenIndices && goldenIndices.has(i);
      arr.push({
        x: leaf.x,
        y: leaf.y,
        rot: leaf.rot,
        scale: leaf.scale,
        src: LEAF_IMAGES[i % LEAF_IMAGES.length],
        isGolden,
      });
    }
    return arr;
  }, [score, goldenIndices]);
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
    // 이름표는 확대 그룹 밖(고정 좌표)에 그려지므로, 나무가 작을 때도 잘리지 않도록 별도로 확보
    if (treeLabel) vy1 = Math.max(vy1, LABEL_Y + 6);
    // 잔디도 확대 그룹 밖(고정 좌표, -14~250 범위)이라 나무가 작을 때도 잘리지 않게 확보 —
    // 기본 프레임(0~240)보다 살짝만 넓혀서 나무가 상대적으로 작아 보이지 않게 함
    vx0 = Math.min(vx0, -14);
    vx1 = Math.max(vx1, 250);
    const pad = 6;
    return `${vx0 - pad} ${vy0 - pad} ${vx1 - vx0 + pad * 2} ${vy1 - vy0 + pad * 2}`;
  }, [scale, leafPaths, visibleFruits, treeLabel]);

  const treeTransform = `translate(${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y}) scale(${scale}) translate(${-GROUND_ANCHOR.x} ${-GROUND_ANCHOR.y})`;

  // 사용자가 손가락(핀치)이나 마우스 휠로 잠깐 확대·축소해서 자세히 볼 수 있게 함 — 나무를
  // 드래그로 옮기는 기능은 없음(줌만). 손을 떼거나 휠 조작을 멈추면 자동으로 원래 배율로
  // 스르륵 돌아옴. 자동으로 계산되는 위 viewBox/scale과는 별개로 잠깐 얹는 값
  const [userZoom, setUserZoom] = useState(1);
  const [interacting, setInteracting] = useState(false);
  // interacting이 꺼진 뒤에도 배율이 1로 스르륵 돌아오는 0.25s 트랜지션이 끝날 때까지는
  // overflow를 계속 열어둬야 축소되는 중간 과정에서 나무가 잘려 보이지 않음
  const [settling, setSettling] = useState(false);
  const settleTimer = useRef(null);
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const wheelIdleTimer = useRef(null);

  const clampZoom = (z) => Math.min(MAX_USER_ZOOM, Math.max(MIN_USER_ZOOM, z));

  const snapBack = () => {
    setInteracting(false);
    setUserZoom(1);
    setSettling(true);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettling(false), 320);
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
      {/* 구름 사진을 꽉 채운 크기로 다시 잘라서(예전엔 캔버스에 여백이 많아 세로로
          너무 길게 렌더링됐었음) 키워도 서로 안 겹치도록 세로 구간(top)을 넉넉히
          나눠서 배치. left 애니메이션은 transform(translateX, vw단위)으로 바꿔서
          — left는 매 프레임 레이아웃을 다시 계산해 느릴 때 뚝뚝 끊겨 보였는데,
          transform은 합성만 타서 훨씬 매끄럽고 훨씬 천천히 흘러가게 함 */}
      {/* 나무(최대 300px, 컨테이너 폭의 92%)보다 살짝 작은 크기감을 주려고 제일 큰
          구름을 폭 80%까지 키움 — 세로로도 커지는 만큼 구간을 넉넉히 벌림. 나무·잔디는
          뒤에서 DOM상 더 나중(=더 위)에 그려지므로 구름이 그 영역까지 걸쳐도 나무를
          가리지 않고 자연스럽게 나무 뒤로 지나감 */}
      <div style={{ top: '-10%', width: '80%', zIndex: 0, animationDuration: '340s' }} className="drift-cloud">
        <Cloud />
      </div>
      <div style={{ top: '26%', width: '52%', zIndex: 0, animationDuration: '400s', animationDelay: '-220s' }} className="drift-cloud">
        <Cloud flip />
      </div>
      <div style={{ top: '52%', width: '34%', zIndex: 0, animationDuration: '370s', animationDelay: '-300s' }} className="drift-cloud">
        <Cloud />
      </div>

      <ThoughtBubble />

      <div
        className="flex-1 flex items-center justify-center w-full px-4"
        style={{ marginTop: '4px', position: 'relative', overflow: interacting || settling ? 'visible' : 'hidden', touchAction: 'pan-y' }}
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
          }}
        >
          {/* 나무 발치에서 오른쪽으로 길게 뻗어나가는 그림자 — 트렁크 쪽은 진하고 좁게,
              오른쪽으로 갈수록 흐리고 넓게 퍼지는 두 겹 + 블러. 배경 사진의 햇빛이 왼쪽
              위에서 오므로 그림자는 반대편(오른쪽)으로 눕듯이 길게 뻗어나감 */}
          <defs>
            <filter id={shadowBlurId} x="-60%" y="-150%" width="220%" height="400%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          <g transform={`rotate(10 ${GROUND_ANCHOR.x} ${GROUND_ANCHOR.y})`} filter={`url(#${shadowBlurId})`}>
            <ellipse cx={GROUND_ANCHOR.x + 60} cy={GROUND_ANCHOR.y + 2} rx={100} ry={11} fill="#1F3D22" opacity="0.17" />
            <ellipse cx={GROUND_ANCHOR.x + 18} cy={GROUND_ANCHOR.y + 1} rx={46} ry={9} fill="#17301A" opacity="0.28" />
          </g>

          {/* 뒷줄 잔디 — 나무 그림보다 먼저 그려서 줄기·가지에 자연스럽게 가려짐 */}
          <GrassRow blades={GRASS_BACK} height={30} keyPrefix="gb" />

          <g transform={treeTransform} style={{ transition: 'transform 0.8s ease' }}>
            <image href="/images/tree.png" x={-5} y={-3} width={250} height={235} preserveAspectRatio="xMidYMax meet" />

            {leafPaths.map((l, i) => {
              const w = 17 * l.scale;
              const h = 17 * l.scale;
              return (
                // 바깥 g: 가지에 붙는 자리·방향을 고정(속성 transform). 안쪽 g: 그 자리에 붙은
                // 채로 잎사귀 끝만 바람에 부채꼴로 흔들리도록 CSS 애니메이션(leaf-fan)을 따로 줌
                // — 속성 transform과 CSS 애니메이션 transform은 같은 요소에 같이 못 걸려서 분리함
                <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}>
                  <g
                    className="leaf-fan"
                    style={{
                      animationDelay: `${-((i * 37) % 340) / 100}s`,
                      animationDuration: `${3 + (i % 5) * 0.35}s`,
                      filter: l.isGolden ? GOLD_LEAF_FILTER : undefined,
                    }}
                  >
                    <image href={l.src} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
                  </g>
                </g>
              );
            })}
            {visibleFruits.map((f, i) => (
              <circle key={`f${i}`} cx={f.x} cy={f.y} r="5.5" fill={STATUS.fruit.color} stroke="#FFF6F0" strokeWidth="1" />
            ))}
          </g>

          {/* 앞줄 잔디 — 나무 그림 다음(=앞)에 그려서 밑동을 살짝 덮되, 키를 낮게 둬서
              나무 자체는 가리지 않음 */}
          <GrassRow blades={GRASS_FRONT} height={26} keyPrefix="gf" />

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
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 px-6">
        <div style={{ width: '100%', maxWidth: '220px' }}>
          <p
            style={{
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px #fff',
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
          <div style={{ marginTop: '6px' }}>
            <HeartBadge count={todayActiveCount} />
          </div>
        </div>
      )}
    </div>
  );
}
