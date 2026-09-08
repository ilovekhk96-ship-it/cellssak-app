import { useState, useEffect } from 'react';
import { Plus, Calendar, Timer } from 'lucide-react';
import { STATUS } from '../data/constants';
import { listenCell } from '../lib/church';
import TreeScene from './TreeScene';
import SceneIcon from './SceneIcon';
import ProfileMenu from './nav/ProfileMenu';
import NotificationBell from './nav/NotificationBell';
import TreeMoveButton from './nav/TreeMoveButton';

const PAGE_BG = 'linear-gradient(to bottom, #CFEFFB 0%, #E3F7EC 52%, #C3E9B9 52%, #A8DE9D 100%)';

export default function PersonalHome({ user, activeCell, pendingRequest, onOpenCellFlow, onSignOut }) {
  const [cellName, setCellName] = useState('');
  const [toast, setToast] = useState('');

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const notReady = () => setToast('준비 중이에요');

  const moveLabel = activeCell
    ? cellName
      ? `${cellName}의 나무`
      : '모임 나무'
    : pendingRequest
    ? '승인 대기중'
    : '모임 선택';

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
        <div className="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>셀싹</span>
          <div className="flex items-center gap-2 shrink-0">
            <ProfileMenu user={user} activeCell={activeCell} onSignOut={onSignOut} />
            <NotificationBell />
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }} className="flex flex-col">
          <TreeScene
            score={0}
            daysCount={0}
            todayActiveCount={0}
            seedCount={0}
            fruitCount={0}
            showActions={false}
            treeLabel={`${user.displayName}의 기도나무`}
          />

          <div style={{ position: 'absolute', left: '14px', bottom: '18px' }} className="flex flex-col items-center gap-2.5">
            <SceneIcon icon={Plus} label="추가" bg="var(--ink)" fg="#FFF8F0" onClick={notReady} />
            <SceneIcon icon={STATUS.seed.icon} label={STATUS.seed.label} bg="#FFFDF9" fg={STATUS.seed.color} onClick={notReady} />
            <SceneIcon icon={STATUS.fruit.icon} label={STATUS.fruit.label} bg="#FFFDF9" fg={STATUS.fruit.color} onClick={notReady} />
            <SceneIcon icon={Calendar} label="캘린더" bg="#FFFDF9" fg="#4A9FD8" onClick={notReady} />
            <SceneIcon icon={Timer} label="타이머" bg="#FFFDF9" fg="#C4456B" onClick={notReady} />
          </div>
        </div>

        <TreeMoveButton onClick={onOpenCellFlow} label={moveLabel} />

        {toast && (
          <div
            style={{ background: 'var(--ink)', color: '#FFF8F0', left: '50%', transform: 'translateX(-50%)' }}
            className="fixed bottom-24 text-sm px-4 py-2.5 rounded-full shadow-lg"
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
