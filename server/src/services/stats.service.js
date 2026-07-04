// Statistikat per panelin administrativ (seksioni 32 + modeli AdminDashboardSummary).
import { db, engineName } from '../db/connection.js';
import { env } from '../config/env.js';
import { mapReservation } from './reservation.service.js';

export async function totalsStatus() {
  const row = await db.one(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'free' THEN 1 ELSE 0 END) AS free
     FROM spots`
  );
  const total = Number(row.total) || 0;
  const free = Number(row.free) || 0;
  return { totalSpots: total, freeSpots: free, occupiedSpots: total - free };
}

export async function zoneBreakdown() {
  const rows = await db.query(
    `SELECT z.id AS zoneId, z.name,
            COUNT(s.id) AS totalSpots,
            SUM(CASE WHEN s.status = 'free' THEN 1 ELSE 0 END) AS freeSpots,
            SUM(CASE WHEN s.status = 'occupied' THEN 1 ELSE 0 END) AS occupiedSpots,
            SUM(CASE WHEN s.status = 'reserved' THEN 1 ELSE 0 END) AS reservedSpots
     FROM zones z LEFT JOIN spots s ON s.zone_id = z.id
     GROUP BY z.id, z.name ORDER BY z.id`
  );
  return rows.map((r) => {
    const totalSpots = Number(r.totalSpots) || 0;
    const freeSpots = Number(r.freeSpots) || 0;
    return {
      zoneId: r.zoneId,
      name: r.name,
      totalSpots,
      freeSpots,
      occupiedSpots: Number(r.occupiedSpots) || 0,
      reservedSpots: Number(r.reservedSpots) || 0,
      occupancyPct: totalSpots
        ? Math.round(((totalSpots - freeSpots) / totalSpots) * 10000) / 100
        : 0,
    };
  });
}

async function paymentBreakdown() {
  const rows = await db.query(
    `SELECT method, COUNT(*) AS count, SUM(amount_cents) AS cents
     FROM payments WHERE status = 'paid' GROUP BY method`
  );
  const byMethod = {
    sms: { count: 0, cents: 0 }, terminal: { count: 0, cents: 0 },
    credits: { count: 0, cents: 0 }, card: { count: 0, cents: 0 },
  };
  for (const r of rows) byMethod[r.method] = { count: Number(r.count), cents: Number(r.cents) || 0 };
  return byMethod;
}

export async function dashboardSummary() {
  const [totals, res, chats, revenue, lastBackup, pay, zones, dbStat] = await Promise.all([
    totalsStatus(),
    db.one(
      `SELECT
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired
       FROM reservations`
    ),
    db.one(
      `SELECT
         SUM(CASE WHEN status IN ('open','assigned') THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed
       FROM chats`
    ),
    db.one("SELECT SUM(amount_cents) AS cents FROM payments WHERE status = 'paid'"),
    db.one("SELECT completed_at FROM backup_logs WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1"),
    paymentBreakdown(),
    zoneBreakdown(),
    databaseStatus(),
  ]);

  return {
    ...totals,
    activeReservations: Number(res.active) || 0,
    pendingReservations: Number(res.pending) || 0,
    expiredReservations: Number(res.expired) || 0,
    totalRevenueCents: Number(revenue.cents) || 0,
    paymentBreakdown: pay,
    zoneBreakdown: zones,
    activeSupportChats: Number(chats.active) || 0,
    closedSupportChats: Number(chats.closed) || 0,
    databaseStatus: dbStat,
    lastBackupAt: lastBackup?.completed_at || null,
    hostingStatus: hostingStatus(),
  };
}

export async function listReservations(filters = {}) {
  const where = [];
  const params = [];
  if (filters.zone) { where.push('zone_id = ?'); params.push(filters.zone.toUpperCase()); }
  if (filters.status) { where.push('status = ?'); params.push(filters.status); }
  if (filters.method) { where.push('payment_method = ?'); params.push(filters.method); }
  if (filters.plate) { where.push('plate LIKE ?'); params.push(`%${filters.plate.toUpperCase()}%`); }
  const sql = `SELECT * FROM reservations ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY created_at DESC LIMIT 300`;
  const rows = await db.query(sql, params);
  return Promise.all(rows.map(mapReservation));
}

export async function listPayments(filters = {}) {
  const where = [];
  const params = [];
  if (filters.method) { where.push('method = ?'); params.push(filters.method); }
  if (filters.status) { where.push('status = ?'); params.push(filters.status); }
  const sql = `SELECT id, method, amount_cents AS amountCents, amount_credits AS amountCredits,
                      status, reservation_id AS reservationId, owner_id AS ownerId,
                      reference, created_at AS createdAt
               FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY created_at DESC LIMIT 300`;
  return db.query(sql, params);
}

export async function databaseStatus() {
  // Madhesia e bazes lexohet nga information_schema (specifike per MySQL).
  let sizeBytes = 0;
  try {
    const row = await db.one(
      `SELECT SUM(data_length + index_length) AS bytes
       FROM information_schema.TABLES WHERE table_schema = ?`,
      [env.mysql.database]
    );
    sizeBytes = Number(row?.bytes) || 0;
  } catch { /* injoro */ }

  const counts = await db.one(
    `SELECT (SELECT COUNT(*) FROM zones) AS zones,
            (SELECT COUNT(*) FROM spots) AS spots,
            (SELECT COUNT(*) FROM reservations) AS reservations,
            (SELECT COUNT(*) FROM payments) AS payments,
            (SELECT COUNT(*) FROM chats) AS chats`
  );
  return { engine: engineName, connected: true, sizeBytes, tables: counts };
}

export function hostingStatus() {
  const mem = process.memoryUsage();
  return {
    environmentName: env.nodeEnv,
    nodeVersion: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(mem.rss / 1024 / 1024),
    port: env.port,
    sslStatus: env.nodeEnv === 'production'
      ? 'Konfiguro TLS në proxy (nginx/Caddy) ose në ofruesin cloud'
      : 'Zhvillim lokal (pa TLS)',
    lastDeploymentAt: null,
  };
}
