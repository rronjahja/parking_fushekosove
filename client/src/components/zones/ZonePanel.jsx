import { useState } from 'react';
import { Search, CarFront, Timer } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { useCountdown } from '../../hooks/useCountdown.js';

// Paneli i zonës aktive: numëratorët, kërkimi me numër, "Gjej veturën time"
// dhe banderola e rezervimit aktiv.
export function ZonePanel({ zone, spots, myReservation, onSelectNumber, onFindCar, onJumpToReservation }) {
  const [value, setValue] = useState('');
  const free = spots.filter((s) => s.status === 'free').length;
  const taken = spots.length - free;
  const { minutes } = useCountdown(myReservation?.expiresAt);

  const submit = (e) => {
    e.preventDefault();
    onSelectNumber(value);
  };

  return (
    <section className="card-pad space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold">
            {zone?.id} <span className="text-sm font-medium text-faint">· {zone?.name}</span>
          </h2>
          <p className="text-xs text-faint">{t.liveMap}</p>
        </div>
        <div className="flex gap-2">
          <span className="chip-mint">{free} {t.free}</span>
          <span className="chip-rose">{taken} {t.occupied}</span>
        </div>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder={`${t.parking}: ${t.parkingPlaceholder}`}
            className="input !pl-9"
            aria-label={t.parking}
          />
        </div>
        <button type="submit" className="btn-primary">{t.select}</button>
      </form>

      <button onClick={onFindCar} className="btn-mint w-full">
        <CarFront size={16} /> {t.findMyCar}
      </button>

      {myReservation && (
        <button
          onClick={() => onJumpToReservation(myReservation)}
          className="flex w-full items-center gap-2 rounded-xl border border-mint/35 bg-mint/10 px-4 py-3 text-left text-sm font-medium text-mint transition-colors hover:bg-mint/15"
        >
          <Timer size={16} className="shrink-0" />
          <span>
            {t.reservationActive(minutes)}{' '}
            <span className="text-faint">— {myReservation.zoneId} / Parkingu {myReservation.spotNumber}</span>
          </span>
        </button>
      )}
    </section>
  );
}
