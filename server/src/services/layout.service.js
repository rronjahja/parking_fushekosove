// Ndertuesi i parkingut (Super Admin): krijimi i zonave te reja (p.sh. P7),
// vendosja/levizja/rrotullimi i vendeve me drag & drop, tipi standard/invalid,
// dhe rinumerimi. Ruajtja eshte transaksionale dhe mbron vendet me rezervime aktive.
import { db } from '../db/connection.js';
import {
  bad, requireNumber, requireInt, requireString, requireZoneId, oneOf,
} from '../utils/validators.js';
import { audit } from './audit.service.js';

const mapZone = (z, counts = null) => ({
  id: z.id,
  name: z.name,
  mapCenter: { lat: z.center_lat, lng: z.center_lng },
  zoomLevel: z.zoom,
  ...(counts || {}),
});

export async function listZonesWithCounts() {
  const zones = await db.query('SELECT * FROM zones ORDER BY id');
  const counts = await db.query(
    `SELECT zone_id,
            COUNT(*) AS totalSpots,
            SUM(CASE WHEN status = 'free' THEN 1 ELSE 0 END) AS freeSpots
     FROM spots GROUP BY zone_id`
  );
  const byZone = Object.fromEntries(counts.map((c) => [c.zone_id, c]));
  return zones.map((z) => {
    const c = byZone[z.id] || { totalSpots: 0, freeSpots: 0 };
    const totalSpots = Number(c.totalSpots) || 0;
    const freeSpots = Number(c.freeSpots) || 0;
    return mapZone(z, { totalSpots, freeSpots, occupiedSpots: totalSpots - freeSpots });
  });
}

export async function getZone(zoneId) {
  const z = await db.one('SELECT * FROM zones WHERE id = ?', [zoneId]);
  if (!z) throw bad(`Zona ${zoneId} nuk ekziston.`, 404, 'NOT_FOUND');
  return z;
}

export async function listSpots(zoneId) {
  await getZone(zoneId);
  const rows = await db.query('SELECT * FROM spots WHERE zone_id = ? ORDER BY number', [zoneId]);
  return rows.map((s) => ({
    id: s.id, zoneId: s.zone_id, number: s.number, type: s.type, status: s.status,
    lat: s.lat, lng: s.lng, angleDeg: s.angle_deg, updatedAt: s.updated_at,
  }));
}

export async function createZone(actor, input) {
  const id = requireZoneId(input.id);
  const name = requireString(input.name, 'emri i zonës', { max: 80 });
  const lat = requireNumber(input.lat, 'lat', { min: -90, max: 90 });
  const lng = requireNumber(input.lng, 'lng', { min: -180, max: 180 });
  const zoom = requireInt(input.zoom ?? 19, 'zoom', { min: 14, max: 21 });
  if (await db.one('SELECT 1 AS x FROM zones WHERE id = ?', [id])) {
    throw bad(`Zona ${id} ekziston tashmë.`, 409, 'CONFLICT');
  }
  await db.run('INSERT INTO zones (id, name, center_lat, center_lng, zoom) VALUES (?, ?, ?, ?, ?)',
    [id, name, lat, lng, zoom]);
  await audit(actor, 'ZONE_CREATE', `zone:${id}`, { name, lat, lng });
  return mapZone(await getZone(id));
}

export async function updateZone(actor, zoneId, input) {
  const z = await getZone(zoneId);
  const name = input.name !== undefined ? requireString(input.name, 'emri', { max: 80 }) : z.name;
  const lat = input.lat !== undefined ? requireNumber(input.lat, 'lat', { min: -90, max: 90 }) : z.center_lat;
  const lng = input.lng !== undefined ? requireNumber(input.lng, 'lng', { min: -180, max: 180 }) : z.center_lng;
  const zoom = input.zoom !== undefined ? requireInt(input.zoom, 'zoom', { min: 14, max: 21 }) : z.zoom;
  await db.run('UPDATE zones SET name = ?, center_lat = ?, center_lng = ?, zoom = ? WHERE id = ?',
    [name, lat, lng, zoom, zoneId]);
  await audit(actor, 'ZONE_UPDATE', `zone:${zoneId}`);
  return mapZone(await getZone(zoneId));
}

export async function deleteZone(actor, zoneId) {
  await getZone(zoneId);
  const row = await db.one(
    "SELECT COUNT(*) AS n FROM reservations WHERE zone_id = ? AND status IN ('active','pending')",
    [zoneId]
  );
  if (Number(row.n) > 0) {
    throw bad(`Zona ${zoneId} ka ${row.n} rezervime aktive dhe nuk mund të fshihet.`, 409, 'CONFLICT');
  }
  await db.run('DELETE FROM spots WHERE zone_id = ?', [zoneId]);
  await db.run('DELETE FROM zones WHERE id = ?', [zoneId]);
  await audit(actor, 'ZONE_DELETE', `zone:${zoneId}`);
}

/**
 * Ruajtja e plote e layout-it te nje zone nga Ndertuesi.
 * spots: [{ id?, number, type, lat, lng, angleDeg }]
 * Rregullat: numra unike; vendet me rezervime aktive nuk mund te hiqen.
 */
export async function saveLayout(actor, zoneId, spots) {
  await getZone(zoneId);
  if (!Array.isArray(spots) || spots.length > 2000) throw bad('Lista e vendeve nuk është e vlefshme.');

  const cleaned = spots.map((s) => ({
    id: s.id ?? null,
    number: requireInt(s.number, 'numri i parkingut', { min: 1, max: 9999 }),
    type: oneOf(s.type ?? 'standard', ['standard', 'accessible'], 'tipi'),
    lat: requireNumber(s.lat, 'lat', { min: -90, max: 90 }),
    lng: requireNumber(s.lng, 'lng', { min: -180, max: 180 }),
    angleDeg: requireNumber(s.angleDeg ?? 0, 'këndi', { min: -360, max: 360 }),
  }));

  const numbers = new Set();
  for (const s of cleaned) {
    if (numbers.has(s.number)) throw bad(`Numri ${s.number} përsëritet. Numrat duhet të jenë unikë.`);
    numbers.add(s.number);
  }

  await db.tx(async (t) => {
    const existing = await t.query('SELECT * FROM spots WHERE zone_id = ?', [zoneId]);
    const keptIds = new Set(cleaned.filter((s) => s.id).map((s) => Number(s.id)));

    // Mbrojtje: vendet me rezervim aktiv nuk mund te fshihen.
    for (const e of existing) {
      if (!keptIds.has(e.id) && e.status !== 'free') {
        throw bad(`Parkingu ${e.number} ka rezervim aktiv dhe nuk mund të fshihet.`, 409, 'CONFLICT');
      }
    }
    // Fshi vendet e hequra.
    for (const e of existing) if (!keptIds.has(e.id)) await t.run('DELETE FROM spots WHERE id = ?', [e.id]);

    // Shmang perplasjet e numrave gjate perditesimit (UNIQUE zone_id+number).
    await t.run('UPDATE spots SET number = number + 100000 WHERE zone_id = ?', [zoneId]);

    for (const s of cleaned) {
      if (s.id) {
        await t.run(
          'UPDATE spots SET number = ?, type = ?, lat = ?, lng = ?, angle_deg = ? WHERE id = ?',
          [s.number, s.type, s.lat, s.lng, s.angleDeg, s.id]
        );
      } else {
        await t.run(
          'INSERT INTO spots (zone_id, number, type, lat, lng, angle_deg) VALUES (?, ?, ?, ?, ?, ?)',
          [zoneId, s.number, s.type, s.lat, s.lng, s.angleDeg]
        );
      }
    }
  });

  await audit(actor, 'LAYOUT_SAVE', `zone:${zoneId}`, { spots: cleaned.length });
  return listSpots(zoneId);
}
