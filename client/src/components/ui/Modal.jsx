import { useEffect } from 'react';
import { X } from 'lucide-react';

// Modal i ripërdorshëm: mbyllet me Escape ose me klik jashtë; scroll i brendshëm.
//
// NË TELEFON shfaqet si "fletë" nga poshtë. Tri gjëra e mbajnë butonin e mbylljes
// gjithnjë brenda ekranit - pa to koka e modalit shkon sipër pjesës së dukshme
// dhe nuk arrihet dot me scroll:
//
//   1. Lartësia matet me njësinë 'dvh' (klasa .sheet-max), jo 'vh'. Në telefon
//      '100vh' është ekrani PA shiritin e adresës, prandaj 92vh del më i lartë
//      se hapësira reale dhe, meqë fleta është e ngjitur poshtë, teprica del
//      jashtë sipër.
//   2. Zona që lëviz ka 'min-h-0'. Në një flex-kolonë fëmija me overflow nuk
//      tkurret pa të: rritet sa përmbajtja dhe e shtyn kokën jashtë.
//   3. Koka ka 'shrink-0' dhe rri ngjitur lart, ndaj nuk ngushtohet kurrë.
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
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`card sheet-max animate-rise flex w-full flex-col overflow-hidden rounded-b-none
          ${wide ? 'sm:max-w-5xl' : 'sm:max-w-md'} sm:rounded-2xl`}
      >
        {/* Dorezë vizuale: tregon se fleta hapet nga poshtë (vetëm në telefon). */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line/40" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line/15 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-faint">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {right}
            {/* 44px: masa minimale e rekomanduar për prekje me gisht. */}
            <button
              onClick={onClose}
              className="btn-ghost !h-11 !w-11 !px-0 !py-0"
              aria-label="Mbyll"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-safe sm:px-5">
          {children}
        </div>
      </div>
    </div>
  );
}