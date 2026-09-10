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
                'drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff) ' +
                'drop-shadow(1.5px 1.5px 0 #fff) drop-shadow(-1.5px -1.5px 0 #fff) drop-shadow(1.5px -1.5px 0 #fff) drop-shadow(-1.5px 1.5px 0 #fff) ' +
                'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
            }}
          />
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
            <span
              style={{
                fontFamily: 'var(--font-display)',
                color: '#000',
                WebkitTextStroke: '1px #FFFFFF',
                paintOrder: 'stroke fill',
                fontSize: '9px',
                lineHeight: '10px',
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
                color: '#000',
                WebkitTextStroke: '1px #FFFFFF',
                paintOrder: 'stroke fill',
                fontSize: '9px',
                lineHeight: '10px',
              }}
            >
              {lineBottom}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
