import { MapPin, Copy } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { euro, timeHM, dateDMY, methodLabel, statusLabel, coordsText } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_CLS = {
  active: 'chip-mint', expired: 'chip', cancelled: 'chip-rose', pending: 'chip-amber',
};

// Tabela kryesore e rezervimeve me filtra (zona, statusi, metoda, targa).
export function ReservationsTable({ rows, zones, filters, onFilters }) {
  const toast = useToast();
  const set = (k) => (e) => onFilters({ ...filters, [k]: e.target.value });

  const copy = async (r) => {
    try {
      await navigator.clipboard.writeText(coordsText(r.coordinates));
      toast.success(t.coordsCopied);
    } catch { toast.error('Kopjimi nuk u lejua.'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-line/15 p-3">
        <select value={filters.zone || ''} onChange={set('zone')} className="input !w-auto !py-2 text-xs">
          <option value="">{t.dash.allZones}</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.id}</option>)}
        </select>
        <select value={filters.status || ''} onChange={set('status')} className="input !w-auto !py-2 text-xs">
          <option value="">{t.dash.allStatuses}</option>
          {['active', 'pending', 'expired', 'cancelled'].map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select value={filters.method || ''} onChange={set('method')} className="input !w-auto !py-2 text-xs">
          <option value="">{t.dash.allMethods}</option>
          {['sms', 'terminal', 'credits'].map((m) => (
            <option key={m} value={m}>{methodLabel(m)}</option>
          ))}
        </select>
        <input
          value={filters.plate || ''}
          onChange={set('plate')}
          placeholder={t.dash.filterPlate}
          className="input !w-44 !py-2 font-mono text-xs uppercase"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line/15 text-[11px] uppercase tracking-wide text-faint">
              {Object.values(t.dash.cols).map((c) => (
                <th key={c} className="px-4 py-3 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/10 hover:bg-raised/50">
                <td className="px-4 py-3 font-display font-bold">{r.zoneId}</td>
                <td className="px-4 py-3 font-mono">{r.spotNumber}</td>
                <td className="px-4 py-3 font-mono font-semibold tracking-wider">{r.plate}</td>
                <td className="px-4 py-3">{r.durationLabel}</td>
                <td className="px-4 py-3 font-mono">{timeHM(r.expiresAt)}</td>
                <td className="px-4 py-3 font-mono">{dateDMY(r.expiresAt)}</td>
                <td className="px-4 py-3">{methodLabel(r.paymentMethod)}</td>
                <td className="px-4 py-3 font-mono">{euro(r.amountCents)}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_CLS[r.status] || 'chip'}>{statusLabel(r.status)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`, '_blank', 'noopener')}
                      className="btn-ghost !px-2 !py-1.5" title="Hap në hartë"
                    >
                      <MapPin size={13} />
                    </button>
                    <button onClick={() => copy(r)} className="btn-ghost !px-2 !py-1.5" title={t.copyCoords}>
                      <Copy size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-faint">{t.dash.noRows}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
