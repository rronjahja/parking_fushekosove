// API-te publike: zonat, vendet, tarifat, statusi total, gjetja e vetures, pin-i.
import { Router } from 'express';
import { db } from '../db/connection.js';
import { TARIFFS, CREDITS_PER_EURO } from '../config/tariffs.js';
import { listZonesWithCounts, listSpots, getZone } from '../services/layout.service.js';
import { totalsStatus } from '../services/stats.service.js';
import { findCarByPlate, getSpotOrThrow } from '../services/reservation.service.js';
import { requireZoneId, requireInt, bad } from '../utils/validators.js';
import { agentsOnline } from '../services/support.service.js';

export const publicRouter = Router();

publicRouter.get('/zones', async (_req, res, next) => {
  try { res.json({ zones: await listZonesWithCounts() }); } catch (e) { next(e); }
});

publicRouter.get('/zones/:zoneId/parkings', async (req, res, next) => {
  try {
    const zoneId = requireZoneId(req.params.zoneId);
    const zone = await getZone(zoneId);
    res.json({
      zone: {
        id: zone.id, name: zone.name,
        mapCenter: { lat: zone.center_lat, lng: zone.center_lng },
        zoomLevel: zone.zoom,
      },
      spots: await listSpots(zoneId),
    });
  } catch (e) { next(e); }
});

publicRouter.get('/parkings/status', async (_req, res, next) => {
  try { res.json(await totalsStatus()); } catch (e) { next(e); }
});

publicRouter.get('/tariffs', (_req, res) =>
  res.json({ tariffs: TARIFFS, creditsPerEuro: CREDITS_PER_EURO })
);

publicRouter.get('/find-car', async (req, res, next) => {
  try {
    if (!req.query.plate) throw bad('Shkruani targën e makinës.');
    const reservation = await findCarByPlate(String(req.query.plate));
    if (!reservation) {
      return res.status(404).json({
        error: 'Nuk u gjet asnjë rezervim aktiv me këtë targë.', code: 'NOT_FOUND',
      });
    }
    res.json({ reservation });
  } catch (e) { next(e); }
});

// Koordinatat dhe linku i jashtem per nje vend parkimi.
publicRouter.post('/navigation/pin', async (req, res, next) => {
  try {
    const zoneId = requireZoneId(req.body?.zoneId);
    const number = requireInt(req.body?.spotNumber, 'parkingu', { min: 1, max: 9999 });
    const spot = await getSpotOrThrow(zoneId, number);
    res.json({
      lat: spot.lat,
      lng: spot.lng,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`,
    });
  } catch (e) { next(e); }
});

publicRouter.get('/support/agents/status', (_req, res) => res.json(agentsOnline()));

publicRouter.get('/system/health', async (_req, res) => {
  let dbOk = true;
  try { await db.one('SELECT 1 AS x'); } catch { dbOk = false; }
  res.json({ ok: dbOk, database: dbOk ? 'connected' : 'down', uptimeSeconds: Math.round(process.uptime()) });
});
