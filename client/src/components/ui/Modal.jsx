import { useEffect } from 'react';
import { X } from 'lucide-react';

// Modal i ripërdorshëm: mbyllet me Escape ose me klik jashtë; scroll i brendshëm.
export function Modal({ open, onClose, title, subtitle, right, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`card w-full ${wide ? 'max-w-5xl' : 'max-w-md'} max-h-[92vh] overflow-hidden animate-rise flex flex-col`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line/15 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-faint">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {right}
            <button onClick={onClose} className="btn-ghost !px-2.5 !py-2" aria-label="Mbyll">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
