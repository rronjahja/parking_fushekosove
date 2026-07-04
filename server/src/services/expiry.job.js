// Skadimi automatik i rezervimeve (seksioni 35 i specifikimit):
// nje "cron" i brendshem kontrollon cdo 3 sekonda rezervimet aktive,
// i kalon ne "expired" dhe liron vendet perkatese.
import { db } from '../db/connection.js';
import { audit } from './audit.service.js';

const PENDING_TIMEOUT_MIN = 15; // rezervimet "pending" (aparat) lirohen pas 15 min pa konfirmim

export async function runExpirySweep() {
  const expired = await db.query(
    "SELECT id, spot_id, zone_id, spot_number FROM reservations WHERE status = 'active' AND expires_at <= NOW()"
  );
  const stalePending = await db.query(
    `SELECT id, spot_id, zone_id, spot_number FROM reservations
     WHERE status = 'pending' AND created_at <= (NOW() - INTERVAL ? MINUTE)`,
    [PENDING_TIMEOUT_MIN]
  );

  if (expired.length === 0 && stalePending.length === 0) return;

  await db.tx(async (t) => {
    for (const r of expired) {
      await t.run("UPDATE reservations SET status = 'expired' WHERE id = ?", [r.id]);
      await t.run("UPDATE spots SET status = 'free' WHERE id = ?", [r.spot_id]);
    }
    for (const r of stalePending) {
      await t.run("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [r.id]);
      await t.run("UPDATE spots SET status = 'free' WHERE id = ?", [r.spot_id]);
    }
  });

  // Auditimi jashte transaksionit (mos e zgjat kyçjen).
  for (const r of expired) {
    await audit('sistemi', 'RESERVATION_EXPIRE', `reservation:${r.id}`, {
      zoneId: r.zone_id, spotNumber: r.spot_number,
    });
  }
  for (const r of stalePending) {
    await audit('sistemi', 'RESERVATION_PENDING_TIMEOUT', `reservation:${r.id}`, {
      zoneId: r.zone_id, spotNumber: r.spot_number,
    });
  }
}

export function startExpiryJob() {
  const tick = () => runExpirySweep().catch((e) => console.error('[EXPIRY]', e.message));
  tick();
  const timer = setInterval(tick, 3000);
  timer.unref?.();
  return timer;
}
