export default function TreeMoveButton({ onClick, lineTop, lineBottom }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ maxWidth: '384px', margin: '0 auto', zIndex: 5 }}>
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <button onClick={onClick} style={{ width: '58px', height: '58px', position: 'relative' }} aria-label="기도나무 이동">
          <img
            src="/images/leaf-badge.png"
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '10px',
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
