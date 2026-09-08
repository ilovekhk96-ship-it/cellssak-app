import { TreePine } from 'lucide-react';
import SceneIcon from '../SceneIcon';

export default function TreeMoveButton({ onClick, label }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-20" style={{ maxWidth: '384px', margin: '0 auto' }}>
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <SceneIcon icon={TreePine} label={label} bg="#6FA66B" fg="#FFF8F0" onClick={onClick} />
      </div>
    </div>
  );
}
