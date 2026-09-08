import { useState, useEffect } from 'react';
import { listenCell } from '../lib/church';
import TreeScene from './TreeScene';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

export default function PersonalHome({ user, activeCell, pendingRequest, onOpenCellFlow }) {
  const [cellName, setCellName] = useState('');

  useEffect(() => {
    if (!activeCell) {
      setCellName('');
      return;
    }
    const unsubscribe = listenCell(activeCell.churchId, activeCell.cellId, (cell) => {
      setCellName(cell?.name || '');
    });
    return unsubscribe;
  }, [activeCell?.churchId, activeCell?.cellId]);

  const navLabel = activeCell
    ? (cellName ? `${cellName} 나무로 이동` : '나무로 이동')
    : pendingRequest
    ? '가입 승인 기다리는 중'
    : '모임 나무 선택하기';

  const vars = {
    '--ink': '#4A3B3F',
    '--ink-soft': '#9C8286',
    '--line': '#F0E2E3',
    '--paper': '#FFF8F0',
    '--font-display': "'Cafe24Dongdong', 'Gowun Dodum', sans-serif",
    '--font-body': "'Gowun Dodum', sans-serif",
  };

  return (
    <div
      style={{
        ...vars,
        background: PAGE_BG,
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
        overflowX: 'hidden',
      }}
      className="w-full min-h-screen"
    >
      <div className="max-w-sm mx-auto min-h-screen relative flex flex-col">
        <h1
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}
          className="text-center pt-8 pb-2 shrink-0"
        >
          {user.displayName}의 기도나무
        </h1>

        <TreeScene score={0} daysCount={0} todayActiveCount={0} seedCount={0} fruitCount={0} showActions={false} />

        <button
          onClick={onOpenCellFlow}
          style={{ background: '#6FA66B', color: '#FFF8F0' }}
          className="fixed bottom-6 right-4 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg"
        >
          {navLabel}
        </button>
      </div>
    </div>
  );
}
