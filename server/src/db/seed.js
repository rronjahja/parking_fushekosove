// Mbushja fillestare e te dhenave per Fushe Kosove (42.640711, 21.101119).
// Gjeneron 6 zona (P1-P6) me gjithsej 470 vende parkimi te vendosura ne rreshta
// realiste rreth qendres, perdorues demo dhe bilance kredish.
import bcrypt from 'bcryptjs';
import { db } from './connection.js';
import { migrate } from './schema.js';
import { destination } from '../utils/geo.js';
import { newId } from '../utils/id.js';

const CENTER = { lat: 42.640711, lng: 21.101119 }; // Fushë Kosovë

/**
 * Gjeneron nje rresht vendesh parkimi.
 * @param {object} o { startLat, startLng, rowBearing, spotAngle, count, startNumber, accessible: [numra] }
 */
function makeRow(o) {
  const spots = [];
  const SPACING_M = 2.7; // gjeresia e nje vendi + hapesira
  for (let i = 0; i < o.count; i++) {
    const p = destination(o.startLat, o.startLng, o.rowBearing, i * SPACING_M);
    const number = o.startNumber + i;
    spots.push({
      number,
      lat: p.lat,
      lng: p.lng,
      angleDeg: o.spotAngle,
      type: (o.accessible || []).includes(number) ? 'accessible' : 'standard',
    });
  }
  return spots;
}

// Perkufizimi i zonave: qendra + rreshtat qe gjenerojne vendet.
// Totali: 54 + 80 + 96 + 60 + 90 + 90 = 470 vende.
function zoneDefinitions() {
  // ndihmese e thjeshte: zhvendos qendren dx metra lindje, dy metra veri
  const at = (dx, dy) => {
    const e = destination(CENTER.lat, CENTER.lng, 90, dx);
    return destination(e.lat, e.lng, 0, dy);
  };

  const defs = [];

  // P1 - rruga "Dardania" prane qendres: 54 vende (14 + 20 + 20)
  {
    const c = at(0, 0);
    const rows = [
      { ...destination(c.lat, c.lng, 300, 25), bearing: 121, angle: 31, count: 14, start: 1, accessible: [1] },
      { ...destination(c.lat, c.lng, 200, 55), bearing: 121, angle: 31, count: 20, start: 15, accessible: [] },
      { ...destination(c.lat, c.lng, 165, 80), bearing: 121, angle: 211, count: 20, start: 35, accessible: [35] },
    ];
    defs.push({ id: 'P1', name: 'Qendra – Dardania', center: c, zoom: 19, rows });
  }
  // P2 - prane stacionit: 80 vende (4 x 20)
  {
    const c = at(320, 140);
    const rows = [0, 1, 2, 3].map((r) => ({
      ...destination(destination(c.lat, c.lng, 0, r * 12).lat, destination(c.lat, c.lng, 0, r * 12).lng, 270, 26),
      bearing: 90, angle: 0, count: 20, start: 1 + r * 20, accessible: r === 0 ? [1, 2] : [],
    }));
    defs.push({ id: 'P2', name: 'Stacioni i Trenit', center: c, zoom: 19, rows });
  }
  // P3 - tregu: 96 vende (4 x 24)
  {
    const c = at(-380, 90);
    const rows = [0, 1, 2, 3].map((r) => ({
      ...destination(destination(c.lat, c.lng, 0, r * 12).lat, destination(c.lat, c.lng, 0, r * 12).lng, 270, 31),
      bearing: 90, angle: 0, count: 24, start: 1 + r * 24, accessible: r === 0 ? [1] : [],
    }));
    defs.push({ id: 'P3', name: 'Tregu i Qytetit', center: c, zoom: 19, rows });
  }
  // P4 - shkolla: 60 vende (3 x 20)
  {
    const c = at(180, -260);
    const rows = [0, 1, 2].map((r) => ({
      ...destination(destination(c.lat, c.lng, 0, r * 12).lat, destination(c.lat, c.lng, 0, r * 12).lng, 270, 26),
      bearing: 90, angle: 0, count: 20, start: 1 + r * 20, accessible: r === 0 ? [1] : [],
    }));
    defs.push({ id: 'P4', name: 'Shkolla "Selman Riza"', center: c, zoom: 19, rows });
  }
  // P5 - komuna: 90 vende (3 x 30)
  {
    const c = at(-220, -200);
    const rows = [0, 1, 2].map((r) => ({
      ...destination(destination(c.lat, c.lng, 0, r * 12).lat, destination(c.lat, c.lng, 0, r * 12).lng, 270, 39),
      bearing: 90, angle: 0, count: 30, start: 1 + r * 30, accessible: r === 0 ? [1, 2] : [],
    }));
    defs.push({ id: 'P5', name: 'Komuna', center: c, zoom: 19, rows });
  }
  // P6 - parku: 90 vende (3 x 30)
  {
    const c = at(60, 320);
    const rows = [0, 1, 2].map((r) => ({
      ...destination(destination(c.lat, c.lng, 0, r * 12).lat, destination(c.lat, c.lng, 0, r * 12).lng, 270, 39),
      bearing: 90, angle: 0, count: 30, start: 1 + r * 30, accessible: r === 0 ? [1] : [],
    }));
    defs.push({ id: 'P6', name: 'Parku i Qytetit', center: c, zoom: 19, rows });
  }

  return defs;
}

export async function seedIfEmpty({ force = false } = {}) {
  await migrate();
  const row = await db.one('SELECT COUNT(*) AS n FROM zones');
  if (Number(row.n) > 0 && !force) return false;

  if (force) {
    await db.exec(`SET FOREIGN_KEY_CHECKS=0;
             DELETE FROM chat_messages; DELETE FROM chats; DELETE FROM reservations;
             DELETE FROM payments; DELETE FROM wallet_transactions; DELETE FROM wallets;
             DELETE FROM spots; DELETE FROM zones; DELETE FROM users; DELETE FROM audit_logs;
             DELETE FROM backup_logs; SET FOREIGN_KEY_CHECKS=1;`);
  }

  await db.tx(async (t) => {
    for (const def of zoneDefinitions()) {
      await t.run('INSERT INTO zones (id, name, center_lat, center_lng, zoom) VALUES (?, ?, ?, ?, ?)',
        [def.id, def.name, def.center.lat, def.center.lng, def.zoom]);
      for (const row2 of def.rows) {
        for (const s of makeRow({
          startLat: row2.lat, startLng: row2.lng, rowBearing: row2.bearing,
          spotAngle: row2.angle, count: row2.count, startNumber: row2.start,
          accessible: row2.accessible,
        })) {
          await t.run(
            'INSERT INTO spots (zone_id, number, type, lat, lng, angle_deg) VALUES (?, ?, ?, ?, ?, ?)',
            [def.id, s.number, s.type, s.lat, s.lng, s.angleDeg]
          );
        }
      }
    }

    // Perdoruesit demo te stafit. NDRYSHONI fjalekalimet ne produksion!
    const users = [
      { username: 'admin',      password: 'Admin123!',  name: 'Administratori i Sistemit', role: 'ADMIN' },
      { username: 'superadmin', password: 'Super123!',  name: 'Super Administratori',      role: 'SUPERADMIN' },
      { username: 'agjenti',    password: 'Agjent123!', name: 'Agjenti i Mbështetjes',     role: 'AGENT' },
    ];
    for (const u of users) {
      await t.run('INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [newId(), u.username, bcrypt.hashSync(u.password, 10), u.name, u.role]);
    }
  });

  console.log('[SEED] U krijuan 6 zona, 470 vende parkimi dhe 3 përdorues të stafit.');
  return true;
}

// Ekzekutim direkt: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedIfEmpty({ force: process.argv.includes('--force') })
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
