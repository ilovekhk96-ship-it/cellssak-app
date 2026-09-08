export default function HeartBadge({ count }) {
  return (
    <div style={{ width: '54px', height: '48px', position: 'relative' }}>
      <svg viewBox="0 0 100 90" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.12))' }}>
        <path
          d="M50,85 C50,85 5,55 5,30 C5,12 20,2 35,2 C43,2 50,8 50,18 C50,8 57,2 65,2 C80,2 95,12 95,30 C95,55 50,85 50,85 Z"
          fill="#FF7F98"
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
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: '#000',
            WebkitTextStroke: '1.5px #FFFFFF',
            paintOrder: 'stroke fill',
            fontSize: '13px',
            lineHeight: '13px',
          }}
        >
          {count}명
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: '#000',
            WebkitTextStroke: '1.5px #FFFFFF',
            paintOrder: 'stroke fill',
            fontSize: '11px',
            lineHeight: '13px',
          }}
        >
          기도중
        </span>
      </div>
    </div>
  );
}
