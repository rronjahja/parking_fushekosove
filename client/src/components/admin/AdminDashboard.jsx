import { useState } from 'react';
import { X } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { fetchDashboard, fetchAdminReservations } from '../../api/endpoints.js';
import { usePolling } from '../../hooks/usePolling.js';
import { StatCards } from './StatCards.jsx';
import { ReservationsTable } from './ReservationsTable.jsx';
import { ZoneBreakdownTable } from './ZoneBreakdownTable.jsx';
import { SystemPanel } from './SystemPanel.jsx';

// Paneli administrativ: hapet nga butoni "Administratori" në header dhe
// mbyllet me "X" pa ndikuar te rezervimet (seksionet 32-33).
// Të dhënat rifreskohen automatikisht çdo 2 sekonda.
export function AdminDashboard({ open, onClose }) {
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ status: 'active' });

  usePolling(() => fetchDashboard().then(setSummary).catch(() => {}), 2000, [], open);
  usePolling(
    () => fetchAdminReservations(filters).then((d) => setRows(d.reservations)).catch(() => {}),
    2000,
    [JSON.stringify(filters)],
    open && tab === 'reservations'
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[950] overflow-y-auto bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">{t.dash.title}</h1>
            <p className="text-sm text-faint">{t.dash.subtitle}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-3" aria-label={t.close}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2">
          {Object.entries(t.dash.tabs).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`btn !py-2 text-xs ${tab === key ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && summary && (
          <div className="space-y-4">
            <StatCards summary={summary} />
            <ZoneBreakdownTable rows={summary.zoneBreakdown} />
          </div>
        )}
        {tab === 'reservations' && summary && (
          <ReservationsTable
            rows={rows}
            zones={summary.zoneBreakdown.map((z) => ({ id: z.zoneId }))}
            filters={filters}
            onFilters={setFilters}
          />
        )}
        {tab === 'system' && <SystemPanel />}
      </div>
    </div>
  );
}
