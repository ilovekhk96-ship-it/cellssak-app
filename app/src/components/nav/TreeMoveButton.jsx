export default function TreeMoveButton({ onClick, lineTop, lineBottom }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ maxWidth: '384px', margin: '0 auto', zIndex: 5 }}>
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <button onClick={onClick} style={{ width: '70px', height: '70px', position: 'relative' }} aria-label="기도나무 이동">
          {/* 흰 원판 대신, 글씨에 쓰는 것과 같은 방식(흰색을 여러 방향으로 겹쳐서 테두리처럼
              보이게)을 잎 사진 실루엣에도 적용 — drop-shadow는 이미지의 알파(투명/불투명)
              모양을 그대로 따라가므로 잎 모양 그대로 흰 테두리가 둘러짐 */}
          <img
            src="/images/leaf-badge.png"
            alt=""
            style={{
              width: '94%',
              height: '94%',
              position: 'absolute',
              inset: '3%',
              objectFit: 'contain',
              filter:
                'drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff) ' +
                'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
            }}
          />
          {/* 잎 테두리를 얇게 유지하면서 글씨는 확실히 보이게, 글씨 뒤에만 작은 흰 쪽지를
              따로 깔아줌 — 잎 무늬(잎맥의 연한 노란빛 등)가 배경이면 글씨의 흰 테두리만으론
              대비가 약해서 안 보이는 경우가 있었음 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '14px',
            }}
          >
            <div
              style={{
                background: 'rgba(255,253,249,0.92)',
                borderRadius: '6px',
                padding: '2px 5px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#3A2E1F',
                  display: 'block',
                  fontSize: '9px',
                  lineHeight: '11px',
                  maxWidth: '44px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lineTop}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#3A2E1F',
                  display: 'block',
                  fontSize: '9px',
                  lineHeight: '11px',
                  textAlign: 'center',
                }}
              >
                {lineBottom}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
