import { X, Check, Pencil, Plus } from 'lucide-react';
import PersonalEntryRow from './PersonalEntryRow';

export default function PersonalListModal({ meta, entries, editMode, setEditMode, onConvert, onEditEntry, onClose, onAdd }) {
  const Icon = meta.icon;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 px-4" style={{ maxWidth: '384px', margin: '0 auto' }}>
      <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={onClose} />
      <div style={{ background: '#FFFDF9', height: '75vh', maxHeight: '600px' }} className="relative w-full rounded-3xl flex flex-col overflow-hidden shadow-xl">
        <div style={{ background: meta.soft }} className="px-4 pt-4 pb-3 shrink-0 relative">
          <button onClick={onClose} style={{ color: 'var(--ink-soft)', position: 'absolute', top: '12px', right: '14px' }}>
            <X size={19} />
          </button>
          <div className="flex items-center gap-1.5">
            <Icon size={17} style={{ color: meta.color }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink)' }} className="font-bold">
              {meta.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pt-2 shrink-0">
          {onAdd ? (
            <button onClick={onAdd} style={{ color: meta.color }} className="flex items-center gap-1 text-xs px-2 py-1 font-medium">
              <Plus size={14} /> 기도씨앗 심기
            </button>
          ) : (
            <span />
          )}
          <button onClick={() => setEditMode(!editMode)} style={{ color: editMode ? meta.color : 'var(--ink-soft)' }} className="flex items-center gap-1 text-xs px-2 py-1">
            {editMode ? (
              <>
                <Check size={14} /> 완료
              </>
            ) : (
              <>
                <Pencil size={14} /> 편집
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {entries.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }} className="text-xs text-center py-12 italic">
              아직 여기엔 기도제목이 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {entries.map((entry) => (
                <PersonalEntryRow key={entry.id} entry={entry} editMode={editMode} onConvert={onConvert} onEditEntry={onEditEntry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
