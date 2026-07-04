import { Navigation2, MapPin, Copy, ArrowLeft, Timer } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { coordsText } from '../../utils/format.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { useToast } from '../../context/ToastContext.jsx';

// Seksioni "Navigim": nis navigimin, hap në Google Maps, kopjo koordinatat, mbrapa.
export function NavigationTab({ spot, myReservation, onBack, onClose }) {
  const toast = useToast();
  const { minutes } = useCountdown(myReservation?.expiresAt);
  const coords = { lat: spot.lat, lng: spot.lng };

  const startNavigation = () => {
    const dest = `${coords.lat},${coords.lng}`;
    const openDirections = (origin) => {
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
      window.open(url, '_blank', 'noopener');
    };
    if (!navigator.geolocation) { openDirections(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => openDirections(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => {
        toast.info('Nuk u lejua lokacioni — po hapet vetëm destinacioni.');
        openDirections(null);
      },
      { timeout: 5000 }
    );
  };

  const openExternal = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
      '_blank',
      'noopener'
    );
  };

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(coordsText(coords));
      toast.success(t.coordsCopied);
    } catch {
      toast.error('Shfletuesi nuk lejoi kopjimin. Koordinatat: ' + coordsText(coords));
    }
  };

  return (
    <div className="space-y-3">
      {myReservation && (
        <div className="flex items-center gap-2 rounded-xl border border-mint/35 bg-mint/10 px-4 py-3 text-sm font-medium text-mint">
          <Timer size={15} /> {t.reservationActive(minutes)}
        </div>
      )}

      <div className="rounded-xl bg-raised px-4 py-3 text-center">
        <div className="label !mb-1">Koordinatat</div>
        <div className="font-mono text-sm font-bold">{coordsText(coords)}</div>
      </div>

      <button onClick={startNavigation} className="btn-primary w-full !py-3">
        <Navigation2 size={16} /> {t.startNav}
      </button>
      <button onClick={openExternal} className="btn w-full !py-3 bg-indigo-600 text-white hover:brightness-110">
        <MapPin size={16} /> {t.openExternal}
      </button>
      <button onClick={copyCoords} className="btn w-full !py-3 bg-cyan/20 text-cyan hover:bg-cyan/30">
        <Copy size={16} /> {t.copyCoords}
      </button>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button onClick={onBack} className="btn-ghost"><ArrowLeft size={15} /> {t.back}</button>
        <button onClick={onClose} className="btn-ghost">{t.close}</button>
      </div>
    </div>
  );
}
