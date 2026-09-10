function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6,20.5H42V20.5H24v7h11.3c-1.6,4.6-6,7.9-11.3,7.9c-6.6,0-12-5.4-12-12s5.4-12,12-12c3.1,0,5.9,1.2,8,3.1l5.7-5.7C34.6,5.1,29.6,3,24,3C12.4,3,3,12.4,3,24s9.4,21,21,21s21-9.4,21-21C45,22.8,44.9,21.6,43.6,20.5z" />
      <path fill="#FF3D00" d="M6.3,14.7l6.6,4.8C14.5,15.5,18.9,13,24,13c3.1,0,5.9,1.2,8,3.1l5.7-5.7C34.6,7.1,29.6,5,24,5C16.3,5,9.7,9.3,6.3,14.7z" />
      <path fill="#4CAF50" d="M24,45c5.5,0,10.4-1.9,14.3-5.1l-6.6-5.6c-2,1.5-4.6,2.4-7.7,2.4c-5.3,0-9.7-3.3-11.3-7.9l-6.6,5.1C9.6,40.6,16.2,45,24,45z" />
      <path fill="#1976D2" d="M43.6,20.5H42V20.5H24v7h11.3c-0.8,2.2-2.2,4.1-4.1,5.5l6.6,5.6C40.4,36.4,45,30.6,45,24C45,22.8,44.9,21.6,43.6,20.5z" />
    </svg>
  );
}

export default function Login({ onSignIn }) {
  return (
    <div
      style={{
        background: "url('/images/bg-field.jpg') center 72% / cover no-repeat",
      }}
      className="w-full min-h-screen flex flex-col items-center justify-center gap-8 px-6 relative"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", fontSize: '3rem', color: '#4A3B3F' }}>
          셀싹
        </h1>
        <p style={{ color: '#4A3B3F' }} className="text-sm text-center leading-relaxed">
          셀원들과 함께 중보기도 나무를 키워요
        </p>
      </div>
      <button
        onClick={onSignIn}
        style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        className="flex items-center gap-2.5 px-6 py-3 rounded-full shadow-md text-sm font-medium active:scale-95 transition-transform"
      >
        <GoogleIcon />
        Google로 로그인
      </button>
      <footer className="absolute bottom-6 left-0 right-0 flex justify-center">
        <a
          href="/privacy.html"
          style={{ color: '#4A3B3F' }}
          className="text-xs underline underline-offset-2 opacity-70"
        >
          개인정보처리방침
        </a>
      </footer>
    </div>
  );
}
