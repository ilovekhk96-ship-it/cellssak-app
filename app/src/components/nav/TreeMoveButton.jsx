import { TreePine } from 'lucide-react';

export default function TreeMoveButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{ background: '#6FA66B', color: '#FFF8F0' }}
      className="fixed bottom-6 right-4 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg"
    >
      <TreePine size={16} />
      {label}
    </button>
  );
}
