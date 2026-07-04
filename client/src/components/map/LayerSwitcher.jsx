import { TILE_LAYERS } from './tileLayers.js';

// Butonat Hibride / Satelitore / Rrugët mbi hartë (si në specifikim).
export function LayerSwitcher({ value, onChange }) {
  return (
    <div className="absolute right-3 top-3 z-[500] flex gap-1 rounded-xl bg-black/45 p-1 backdrop-blur">
      {Object.entries(TILE_LAYERS).map(([key, layer]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === key ? 'bg-white text-slate-900' : 'text-white/90 hover:bg-white/15'
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}
