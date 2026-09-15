// Zemra e sistemit: "Paguaj & Rezervo" si proces ATOMIK.
// Perdorim nje transaksion MySQL (InnoDB) me "SELECT ... FOR UPDATE" qe e
// mbyll rreshtin e vendit derisa te perfundoje transaksioni - keshtu dy
// perdorues NUK mund te rezervojne te njejtin vend njekohesisht
// (kerkesat e sigurise nr. 3, 4 dhe kriteret e pranimit nr. 21/28).
import { db } from '../db/connection.js';
import { newId } from '../utils/id.js';
import { getTariff } from '../config/tariffs.js';
import {
  PAYMENT_METHOD, PAYMENT_STATUS, RESERVATION_STATUS, SPOT_STATUS,
} from '../config/constants.js';
import { bad, normalizePlate, requireInt, requireZoneId, oneOf } from '../utils/validators.js';
import { debitCredits } from './wallet.service.js';
import { chargeExternal } from '../payments/index.js';
import { audit } from './audit.service.js';

const fmtDateTime = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
const now = () => fmtDateTime(new Date());
const plusMinutes = (m) => fmtDateTime(new Date(Date.now() + m * 60_000));

export async function getSpotOrThrow(zoneId, spotNumber) {
  const spot = await db.one('SELECT * FROM spots WHERE zone_id = ? AND number = ?', [zoneId, spotNumber]);
  if (!spot) throw bad(`Parkingu ${spotNumber} nuk ekziston në zonën ${zoneId}.`, 404, 'NOT_FOUND');
  return spot;
}

/**
 * Procesi i plote "Paguaj & Rezervo".
 * Pagesat e jashtme (SMS/Aparat) autorizohen PARA transaksionit (async),
 * ndersa kyçja e vendit, zbritja e krediteve dhe krijimi i rezervimit
 * ndodhin BRENDA nje transaksioni te vetem me kyçje rreshti.
 */
export async function payAndReserve(ownerId, input) {
  const zoneId = requireZoneId(input.zoneId);
  const spotNumber = requireInt(input.spotNumber, 'parkingu', { min: 1, max: 9999 });
  const plate = input.plateForeign
    ? String(input.plate || '').trim().toUpperCase().slice(0, 14)
    : normalizePlate(input.plate);
  if (!plate) throw bad('Targa e makinës është e detyrueshme.');
  const method = oneOf(input.method, Object.values(PAYMENT_METHOD), 'mënyra e pagesës');
  const tariff = getTariff(input.durationKey);
  if (!tariff) throw bad('Zgjidhni një kohëzgjatje të vlefshme.');

  // Vizitoret pa llogari paguajne me SMS ose ne aparat. Kuleta me kredi i
  // perket nje llogarie reale, prandaj bllokohet ketu e jo vetem ne nderfaqe.
  if (method === PAYMENT_METHOD.CREDITS && String(ownerId).startsWith('guest:')) {
    throw bad('Pagesa me kredi kërkon llogari. Zgjidhni SMS ose aparatin.', 401, 'GUEST_NO_CREDITS');
  }

  // Para-kontroll i shpejte (kontrolli perfundimtar behet brenda transaksionit).
  const pre = await getSpotOrThrow(zoneId, spotNumber);
  if (pre.status !== SPOT_STATUS.FREE) {
    throw bad(`Parkingu ${spotNumber} në zonën ${zoneId} është i zënë.`, 409, 'SPOT_TAKEN');
  }

  // Pagesa e jashtme (placeholder) - jashte transaksionit sepse eshte async.
  let external = null;
  if (method !== PAYMENT_METHOD.CREDITS) {
    external = await chargeExternal(method, { plate, zoneId, spotNumber, euroCents: tariff.euroCents });
    if (external.status !== 'paid' && external.status !== 'pending') {
      throw bad('Pagesa nuk u konfirmua. Provoni përsëri.', 402, 'PAYMENT_FAILED');
    }
  }

  const reservationId = await db.tx(async (t) => {
    // Kyçja ATOMIK e rreshtit te vendit (FOR UPDATE) + rikontroll i statusit.
    const spot = await t.one(
      'SELECT * FROM spots WHERE zone_id = ? AND number = ? FOR UPDATE',
      [zoneId, spotNumber]
    );
    if (!spot || spot.status !== SPOT_STATUS.FREE) {
      throw bad(`Parkingu ${spotNumber} sapo u zu nga një përdorues tjetër.`, 409, 'SPOT_TAKEN');
    }

    if (method === PAYMENT_METHOD.CREDITS) {
      await debitCredits(t, ownerId, tariff.credits, `Parkim ${zoneId}/${spotNumber} (${tariff.label})`);
    }

    const paymentId = newId();
    await t.run(
      `INSERT INTO payments (id, method, amount_cents, amount_credits, status, owner_id, reference)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId, method, tariff.euroCents, tariff.credits,
        external?.status === 'pending' ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID,
        ownerId, external?.reference ?? 'KREDITE-BRENDSHME',
      ]
    );

    const newReservationId = newId();
    const status = external?.status === 'pending' ? RESERVATION_STATUS.PENDING : RESERVATION_STATUS.ACTIVE;
    await t.run(
      `INSERT INTO reservations
        (id, zone_id, spot_id, spot_number, plate, duration_key, duration_label, minutes,
         amount_cents, amount_credits, payment_method, payment_id, status, owner_id,
         start_time, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newReservationId, zoneId, spot.id, spotNumber, plate, tariff.key, tariff.label,
        tariff.minutes, tariff.euroCents, tariff.credits, method, paymentId, status,
        ownerId, now(), plusMinutes(tariff.minutes),
      ]
    );

    await t.run('UPDATE payments SET reservation_id = ? WHERE id = ?', [newReservationId, paymentId]);
    await t.run('UPDATE spots SET status = ? WHERE id = ?', [SPOT_STATUS.RESERVED, spot.id]);
    return newReservationId;
  });

  await audit(ownerId, 'RESERVATION_CREATE', `reservation:${reservationId}`, {
    zoneId, spotNumber, plate, method, durim: tariff.label, euroCents: tariff.euroCents,
  });
  return getReservation(reservationId);
}

export async function getReservation(id) {
  const r = await db.one('SELECT * FROM reservations WHERE id = ?', [id]);
  return r ? mapReservation(r) : null;
}

export async function mapReservation(r) {
  const spot = await db.one('SELECT lat, lng, type FROM spots WHERE id = ?', [r.spot_id]);
  return {
    id: r.id,
    zoneId: r.zone_id,
    spotNumber: r.spot_number,
    plate: r.plate,
    durationKey: r.duration_key,
    durationLabel: r.duration_label,
    minutes: r.minutes,
    amountCents: r.amount_cents,
    amountCredits: r.amount_credits,
    paymentMethod: r.payment_method,
    status: r.status,
    startTime: r.start_time,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    coordinates: spot ? { lat: spot.lat, lng: spot.lng } : null,
    spotType: spot?.type,
  };
}

export async function findCarByPlate(plate) {
  const normalized = normalizePlate(plate);
  const r = await db.one(
    `SELECT * FROM reservations WHERE plate = ? AND status IN ('active','pending')
     ORDER BY created_at DESC LIMIT 1`,
    [normalized]
  );
  return r ? mapReservation(r) : null;
}

export async function activeReservationsForOwner(ownerId) {
  const rows = await db.query(
    `SELECT * FROM reservations WHERE owner_id = ? AND status IN ('active','pending')
     ORDER BY created_at DESC`,
    [ownerId]
  );
  return Promise.all(rows.map(mapReservation));
}

// Historiku i plotë i parkimeve të përdoruesit (të gjitha statuset).
export async function reservationHistoryForOwner(ownerId, limit = 100) {
  const rows = await db.query(
    'SELECT * FROM reservations WHERE owner_id = ? ORDER BY created_at DESC LIMIT ?',
    [ownerId, Number(limit) || 100]
  );
  return Promise.all(rows.map(mapReservation));
}

// Pasuron vendet e një zone me info rezervimi:
//  • expiringSoon: rezervimi aktiv skadon brenda 10 minutave
//  • mine: rezervimi aktiv i përket përdoruesit aktual (për shenjën në hartë)
export async function spotsWithReservationInfo(zoneId, currentUserId = null) {
  const spots = await db.query('SELECT * FROM spots WHERE zone_id = ? ORDER BY number', [zoneId]);
  const actives = await db.query(
    `SELECT spot_id, owner_id, expires_at,
            TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS seconds_left
     FROM reservations WHERE zone_id = ? AND status IN ('active','pending')`,
    [zoneId]
  );
  const bySpot = new Map();
  for (const r of actives) bySpot.set(r.spot_id, r);

  return spots.map((s) => {
    const r = bySpot.get(s.id);
    const secondsLeft = r ? Number(r.seconds_left) : null;
    return {
      id: s.id, zoneId: s.zone_id, number: s.number, type: s.type, status: s.status,
      lat: s.lat, lng: s.lng, angleDeg: s.angle_deg, updatedAt: s.updated_at,
      expiringSoon: secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 600,
      secondsLeft: secondsLeft !== null && secondsLeft > 0 ? secondsLeft : null,
      mine: Boolean(r && currentUserId && r.owner_id === currentUserId),
    };
  });
}