import { t } from '../../i18n/sq.js';

// Butonat e zonave P1...Pn - zona aktive theksohet me të verdhë (si në mockup).
export function ZonePicker({ zones, activeId, onSelect }) {
  return (
    <section className="card-pad">
      <h2 className="label !mb-3">{t.chooseZone}</h2>
      <div className="flex flex-wrap gap-2">
        {zones.length === 0 &&
          [1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className="h-11 w-16 animate-pulse rounded-xl bg-raised" />
          ))}
        {zones.map((z) => {
          const active = z.id === activeId;
          return (
            <button
              key={z.id}
              onClick={() => onSelect(z.id)}
              className={`rounded-xl px-5 py-2.5 font-display text-sm font-bold transition-all ${
                active
                  ? 'bg-amber text-[#2B1A02] shadow-[0_0_18px_-4px_rgb(251_191_36/0.6)]'
                  : 'bg-raised text-ink hover:bg-raised/70 border border-line/20'
              }`}
              title={z.name}
            >
              {z.id}
            </button>
          );
        })}
      </div>
    </section>
  );
}
