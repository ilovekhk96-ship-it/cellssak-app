export default function TreeMoveButton({ onClick, lineTop, lineBottom }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ maxWidth: '384px', margin: '0 auto', zIndex: 5 }}>
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <button onClick={onClick} style={{ width: '58px', height: '58px', position: 'relative' }} aria-label="기도나무 이동">
          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' }}
          >
            <rect x="44" y="60" width="12" height="28" rx="3" fill="#8B6B4A" stroke="#1F2A2E" strokeWidth="2" />
            <path
              d="M50,8 C68,8 82,22 82,40 C82,50 76,58 66,60 C70,64 70,70 64,72 C58,74 42,74 36,72 C30,70 30,64 34,60 C24,58 18,50 18,40 C18,22 32,8 50,8 Z"
              fill="#6FA66B"
              stroke="#1F2A2E"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
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
