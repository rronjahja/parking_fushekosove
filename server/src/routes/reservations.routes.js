import { Router } from 'express';
import { requireIdentity } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';
import { payAndReserve, activeReservationsForOwner } from '../services/reservation.service.js';

export const reservationsRouter = Router();

// Endpoint-i transaksional i rekomanduar nga specifikimi:
// verifikon vendin, pagesen dhe krijon rezervimin ne NJE proces te vetem.
reservationsRouter.post('/pay-and-reserve', requireIdentity, paymentLimiter, async (req, res, next) => {
  try {
    const reservation = await payAndReserve(req.user.id, req.body || {});
    res.status(201).json({ reservation });
  } catch (e) { next(e); }
});

// Rezervimet aktive te identitetit aktual (perdoret nga "Gjej veturën time" / statusi).
reservationsRouter.get('/mine/active', requireIdentity, async (req, res, next) => {
  try { res.json({ reservations: await activeReservationsForOwner(req.user.id) }); }
  catch (e) { next(e); }
});
