import { useEffect, useState } from 'react';
import { DatabaseBackup, RotateCcw, Server, ScrollText } from 'lucide-react';
import {
  fetchDbStatus, runBackup, stageRestore, fetchHosting, fetchAuditLogs,
} from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const fmtBytes = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

// Paneli i sistemit: statusi i bazës, backup/restore, hostingu dhe audit log-u.
export function SystemPanel() {
  const toast = useToast();
  const { isSuper } = useAuth();
  const [dbStatus, setDbStatus] = useState(null);
  const [hosting, setHosting] = useState(null);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchDbStatus().then(setDbStatus).catch(() => {});
    fetchHosting().then(setHosting).catch(() => {});
    fetchAuditLogs().then((d) => setLogs(d.logs)).catch(() => {});
  };
  useEffect(load, []);

  const backup = async () => {
    setBusy(true);
    try {
      await runBackup();
      toast.success('Backup-i u krijua me sukses.');
      load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const restore = async (id) => {
    if (!window.confirm('Të planifikohet rikthimi nga ky backup? Aplikohet në rinisjen e serverit.')) return;
    try {
      const r = await stageRestore(id);
      toast.info(r.message);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <DatabaseBackup size={15} className="text-cyan" /> Baza e të dhënave
          </h3>
          <button onClick={backup} disabled={busy} className="btn-primary !py-1.5 text-xs">
            {busy ? <Spinner size={13} /> : 'Bëj backup tani'}
          </button>
        </div>
        {dbStatus && (
          <div className="space-y-1.5 text-sm">
            <Row k="Motori" v={dbStatus.engine} />
            <Row k="Madhësia" v={fmtBytes(dbStatus.sizeBytes)} />
            <Row k="Tabelat" v={`${dbStatus.tables.zones} zona · ${dbStatus.tables.spots} vende · ${dbStatus.tables.reservations} rezervime · ${dbStatus.tables.payments} pagesa`} />
          </div>
        )}
        <h4 className="label mt-4">Backup-et e fundit</h4>
        <div className="max-h-44 space-y-1.5 overflow-y-auto">
          {(dbStatus?.backups || []).map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg bg-raised px-3 py-2 text-xs">
              <span className="font-mono">{b.startedAt}</span>
              <span className={b.status === 'completed' ? 'text-mint' : 'text-rose'}>{b.status}</span>
              {isSuper && b.status === 'completed' && (
                <button onClick={() => restore(b.id)} className="btn-ghost !px-2 !py-1 text-[10px]" title="Rikthe">
                  <RotateCcw size={11} />
                </button>
              )}
            </div>
          ))}
          {(!dbStatus?.backups || dbStatus.backups.length === 0) && (
            <p className="text-xs text-faint">Nuk ka backup ende.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
            <Server size={15} className="text-cyan" /> Hostingu
          </h3>
          {hosting && (
            <div className="space-y-1.5 text-sm">
              <Row k="Mjedisi" v={hosting.environmentName} />
              <Row k="Node" v={hosting.nodeVersion} />
              <Row k="Uptime" v={`${Math.floor(hosting.uptimeSeconds / 60)} min`} />
              <Row k="Memoria" v={`${hosting.memoryMB} MB`} />
              <Row k="SSL/TLS" v={hosting.sslStatus} />
            </div>
          )}
        </div>
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
            <ScrollText size={15} className="text-cyan" /> Audit log
          </h3>
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="rounded-lg bg-raised px-3 py-2 text-xs">
                <span className="font-mono text-cyan">{l.action}</span>
                <span className="text-faint"> · {l.entity || '—'} · {l.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-3">
    <span className="text-faint">{k}</span>
    <span className="text-right font-medium">{v}</span>
  </div>
);
