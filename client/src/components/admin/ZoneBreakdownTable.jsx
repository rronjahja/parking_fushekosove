import { t } from '../../i18n/sq.js';

// Tabela e statusit sipas zonave (seksioni 32, tabela e dytë).
export function ZoneBreakdownTable({ rows }) {
  return (
    <div className="card overflow-hidden">
      <h3 className="border-b border-line/15 px-4 py-3 font-display text-sm font-bold">
        {t.dash.zoneTable}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line/15 text-[11px] uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-semibold">{t.zone}</th>
              <th className="px-4 py-3 font-semibold">{t.dash.zoneCols.total}</th>
              <th className="px-4 py-3 font-semibold">{t.dash.zoneCols.free}</th>
              <th className="px-4 py-3 font-semibold">{t.dash.zoneCols.occupied}</th>
              <th className="px-4 py-3 font-semibold">{t.dash.zoneCols.reserved}</th>
              <th className="px-4 py-3 font-semibold">{t.dash.zoneCols.pct}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((z) => (
              <tr key={z.zoneId} className="border-b border-line/10">
                <td className="px-4 py-3 font-display font-bold">{z.zoneId} <span className="text-xs font-normal text-faint">{z.name}</span></td>
                <td className="px-4 py-3 font-mono">{z.totalSpots}</td>
                <td className="px-4 py-3 font-mono text-mint">{z.freeSpots}</td>
                <td className="px-4 py-3 font-mono text-rose">{z.occupiedSpots}</td>
                <td className="px-4 py-3 font-mono text-amber">{z.reservedSpots}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raised">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${z.occupancyPct}%` }} />
                    </div>
                    <span className="font-mono text-xs">{z.occupancyPct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
