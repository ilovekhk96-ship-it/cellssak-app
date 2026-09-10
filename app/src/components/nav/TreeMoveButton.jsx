export default function TreeMoveButton({ onClick, lineTop, lineBottom }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ maxWidth: '384px', margin: '0 auto', zIndex: 5 }}>
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <button onClick={onClick} style={{ width: '62px', height: '62px', position: 'relative' }} aria-label="기도나무 이동">
          {/* 잎 사진이 배경(하늘/잔디)이랑 초록끼리 묻혀서 안 보이길래, 흰 원판을 깔아
              어디서든 도드라지게 함 */}
          <div
            style={{
              position: 'absolute',
              inset: '2px',
              borderRadius: '50%',
              background: '#FFFDF9',
              boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
            }}
          />
          <img
            src="/images/leaf-badge.png"
            alt=""
            style={{ width: '84%', height: '84%', position: 'absolute', inset: '8%', objectFit: 'contain' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                color: '#000',
                WebkitTextStroke: '1.2px #FFFFFF',
                paintOrder: 'stroke fill',
                fontSize: '10px',
                lineHeight: '11px',
                maxWidth: '48px',
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
                WebkitTextStroke: '1.2px #FFFFFF',
                paintOrder: 'stroke fill',
                fontSize: '10px',
                lineHeight: '11px',
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
