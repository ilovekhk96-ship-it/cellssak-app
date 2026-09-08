export default function SceneIcon({ icon: Icon, label, count, bg, fg, onClick }) {
  return (
    <button onClick={onClick} style={{ background: bg, color: fg }} className="w-14 h-14 rounded-2xl shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform">
      <Icon size={16} />
      <span style={{ fontSize: '8.5px', lineHeight: '10px', textAlign: 'center' }}>{label}</span>
      {typeof count === 'number' && <span style={{ fontSize: '8.5px', opacity: 0.75 }}>{count}명</span>}
    </button>
  );
}
