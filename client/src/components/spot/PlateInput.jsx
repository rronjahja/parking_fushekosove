import { useState } from 'react';
import { t } from '../../i18n/sq.js';

// Formatimi i targës kosovare: 0Y-XXX-ZZ (0, rajoni 1-7, 3 shifra, 2 shkronja).
function formatKosovo(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let out = '';
  for (let i = 0; i < clean.length && out.replace(/-/g, '').length < 7; i++) {
    const ch = clean[i];
    const pos = out.replace(/-/g, '').length;
    if (pos === 0) { if (ch === '0') out += '0'; }
    else if (pos === 1) { if (/[1-7]/.test(ch)) out += ch; }
    else if (pos >= 2 && pos <= 4) { if (/[0-9]/.test(ch)) out += ch; }
    else if (pos >= 5 && pos <= 6) { if (/[A-Z]/.test(ch)) out += ch; }
    const nowLen = out.replace(/-/g, '').length;
    if (nowLen === 2 && !out.includes('-')) out += '-';
    if (nowLen === 5 && out.split('-').length < 3) out += '-';
  }
  return out;
}

// Targa të huaja: pa validim, pranon çdo format (shkronja, shifra, hapësira, viza).
function formatForeign(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').slice(0, 14);
}

export function PlateInput({ value, onChange, foreign, onForeignChange }) {
  // Nëse prindi nuk e kontrollon vetë llojin, e mbajmë lokalisht.
  const [localForeign, setLocalForeign] = useState(false);
  const isForeign = foreign ?? localForeign;
  const setForeign = (v) => {
    if (onForeignChange) onForeignChange(v);
    else setLocalForeign(v);
    onChange(''); // pastro fushën kur ndërron lloji
  };

  return (
    <div>
      <label className="label">{t.plate}</label>

      {/* Zgjedhja e llojit: Kosovare / Targa të Huaja */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setForeign(false)}
          className={`btn !py-2 text-xs ${!isForeign ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
        >
          Kosovare
        </button>
        <button
          type="button"
          onClick={() => setForeign(true)}
          className={`btn !py-2 text-xs ${isForeign ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
        >
          Targa të Huaja
        </button>
      </div>

      <div className={`relative mx-auto ${isForeign ? 'w-[210px]' : 'w-[190px]'}`}>
        {/* Shiriti anësor: RKS për Kosovë, blu i thjeshtë për të huajat */}
        {isForeign ? (
          <span className="plate-band" aria-hidden="true" />
        ) : (
          <span className="plate-band">
            <span className="text-[8px] font-bold text-yellow-300">★</span>
            <span className="text-[8px] font-bold text-white">RKS</span>
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(isForeign ? formatForeign(e.target.value) : formatKosovo(e.target.value))}
          placeholder={isForeign ? 'Targa e huaj' : '0X-XXX-ZZ'}
          inputMode="text"
          maxLength={isForeign ? 14 : 9}
          className="input plate-input !pl-9 !pr-2"
          aria-label={t.plate}
        />
      </div>
    </div>
  );
}