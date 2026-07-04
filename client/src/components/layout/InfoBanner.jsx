import { t } from '../../i18n/sq.js';

// Paneli informues: shpjegon logjikën e ngjyrave në hartë (seksioni 4).
export function InfoBanner() {
  return (
    <div className="card-pad border-l-4 !border-l-cyan">
      <p className="text-sm leading-relaxed text-faint">{t.infoBanner}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip-mint">● {t.legend.free}</span>
        <span className="chip-rose">● {t.legend.taken}</span>
        <span className="chip-amber">● {t.legend.selected}</span>
        <span className="chip-azure">♿ {t.legend.accessible}</span>
      </div>
    </div>
  );
}
