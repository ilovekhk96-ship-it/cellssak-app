import { X, Check, Pencil } from 'lucide-react';
import { FULL_INDEX } from '../data/constants';
import EntryRow from './EntryRow';

export default function ListModal({ meta, verse, entries, grouped, editMode, setEditMode, listRef, groupRefs, indexBarRef, onIndexPoint, onPray, onConvert, onLike, onEditEntry, onClose, myUid, isLeader }) {
  const Icon = meta.icon;
  const labels = FULL_INDEX.filter((l) => grouped[l] && grouped[l].length > 0);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 px-4" style={{ maxWidth: '384px', margin: '0 auto' }}>
      <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={onClose} />
      <div style={{ background: '#FFFDF9', height: '82vh', maxHeight: '640px' }} className="relative w-full rounded-3xl flex flex-col overflow-hidden shadow-xl">
        <div style={{ background: meta.soft }} className="px-4 pt-4 pb-3 shrink-0 relative">
          <button onClick={onClose} style={{ color: 'var(--ink-soft)', position: 'absolute', top: '12px', right: '14px' }}>
            <X size={19} />
          </button>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon size={17} style={{ color: meta.color }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink)' }} className="font-bold">
              {meta.label}
            </span>
          </div>
          <p style={{ color: 'var(--ink)' }} className="text-xs leading-relaxed pr-6">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p style={{ color: meta.color }} className="text-xs mt-0.5 font-medium">
            {verse.ref}
          </p>
        </div>

        <div className="flex items-center justify-end px-4 pt-2 shrink-0">
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

        <div className="flex-1 flex min-h-0">
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollBehavior: 'smooth' }}>
            {entries.length === 0 && (
              <p style={{ color: 'var(--ink-soft)' }} className="text-xs text-center py-12 italic">
                아직 이 페이지엔 이름이 없어요.
              </p>
            )}
            {labels.map((label) => (
              <div key={label} ref={(el) => (groupRefs.current[label] = el)}>
                <p style={{ color: meta.color, fontFamily: 'var(--font-display)' }} className="text-xs font-bold pt-2 pb-1 pl-1">
                  {label}
                </p>
                <div className="flex flex-col gap-2 mb-1">
                  {grouped[label].map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      meta={meta}
                      editMode={editMode}
                      canEdit={isLeader || entry.authorUid === myUid}
                      onPray={onPray}
                      onConvert={onConvert}
                      onLike={onLike}
                      onEditEntry={onEditEntry}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            ref={indexBarRef}
            onTouchStart={(e) => onIndexPoint(e.touches[0].clientY)}
            onTouchMove={(e) => onIndexPoint(e.touches[0].clientY)}
            onMouseDown={(e) => onIndexPoint(e.clientY)}
            style={{ touchAction: 'none', width: '16px' }}
            className="flex flex-col items-center justify-center py-1 select-none shrink-0"
          >
            {FULL_INDEX.map((label) => (
              <span key={label} style={{ fontSize: '7.5px', lineHeight: '9.6px', color: grouped[label] ? 'var(--ink-soft)' : '#E8DADB' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
