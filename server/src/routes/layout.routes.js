// Ndertuesi i parkingut - VETEM per Super Admin.
import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import {
  createZone, updateZone, deleteZone, saveLayout, listSpots,
} from '../services/layout.service.js';
import { requireZoneId } from '../utils/validators.js';

export const layoutRouter = Router();
const superOnly = requireRole(ROLES.SUPERADMIN);

layoutRouter.post('/zones', superOnly, async (req, res, next) => {
  try { res.status(201).json({ zone: await createZone(req.user.id, req.body || {}) }); }
  catch (e) { next(e); }
});

layoutRouter.patch('/zones/:zoneId', superOnly, async (req, res, next) => {
  try { res.json({ zone: await updateZone(req.user.id, requireZoneId(req.params.zoneId), req.body || {}) }); }
  catch (e) { next(e); }
});

layoutRouter.delete('/zones/:zoneId', superOnly, async (req, res, next) => {
  try {
    await deleteZone(req.user.id, requireZoneId(req.params.zoneId));
    res.json({ deleted: true });
  } catch (e) { next(e); }
});

// Ruajtja e plote e layout-it te zones (drag & drop nga Ndertuesi).
layoutRouter.put('/zones/:zoneId/spots', superOnly, async (req, res, next) => {
  try {
    const zoneId = requireZoneId(req.params.zoneId);
    res.json({ spots: await saveLayout(req.user.id, zoneId, req.body?.spots) });
  } catch (e) { next(e); }
});

layoutRouter.get('/zones/:zoneId/spots', superOnly, async (req, res, next) => {
  try { res.json({ spots: await listSpots(requireZoneId(req.params.zoneId)) }); }
  catch (e) { next(e); }
});
