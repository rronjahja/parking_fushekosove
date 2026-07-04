import { euro } from '../../utils/format.js';

// Zgjedhja e kohëzgjatjes - radio list si në mockup, totali përditësohet menjëherë.
export function DurationPicker({ tariffs, value, onChange }) {
  return (
    <div className="space-y-2">
      {tariffs.map((tr) => {
        const active = tr.key === value;
        return (
          <label
            key={tr.key}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
              active
                ? 'border-cyan bg-cyan/10 shadow-[0_0_14px_-4px_rgb(34_211_238/0.5)]'
                : 'border-line/25 bg-raised hover:border-line/45'
            }`}
          >
            <span className="font-medium">
              {tr.label} <span className="text-faint">({euro(tr.euroCents)})</span>
              <span className="ml-1.5 text-xs text-faint">– {tr.credits} kredi</span>
            </span>
            <input
              type="radio"
              name="duration"
              checked={active}
              onChange={() => onChange(tr.key)}
              className="h-4 w-4 accent-cyan"
            />
          </label>
        );
      })}
    </div>
  );
}
