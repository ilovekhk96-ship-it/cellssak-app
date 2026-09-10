import { useState } from 'react';
import { PRAYER_VERSES } from '../data/constants';

export default function ThoughtBubble() {
  const [verse] = useState(() => PRAYER_VERSES[Math.floor(Math.random() * PRAYER_VERSES.length)]);
  return (
    <div className="thought-bubble flex flex-col items-center pt-4 px-6" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ background: '#FFFDF9', maxWidth: '260px' }} className="rounded-3xl px-4 py-3 shadow-sm text-center">
        <p style={{ color: 'var(--ink)' }} className="text-xs leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p style={{ color: '#7C9EC9' }} className="text-xs mt-1 font-medium">
          {verse.ref}
        </p>
      </div>
      <div style={{ background: '#FFFDF9', width: '13px', height: '13px', borderRadius: '50%', marginTop: '5px' }} />
      <div style={{ background: '#FFFDF9', width: '7px', height: '7px', borderRadius: '50%', marginTop: '4px' }} />
    </div>
  );
}
