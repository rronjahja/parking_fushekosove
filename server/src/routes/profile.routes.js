// Profili i përdoruesit: të dhënat, historiku i parkimeve dhe i bisedave.
import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireIdentity } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { reservationHistoryForOwner } from '../services/reservation.service.js';
import { chatHistoryForOwner } from '../services/support.service.js';
import { getOrCreateWallet } from '../services/wallet.service.js';
import { verifyCode, issueCode } from '../services/verification.service.js';
import { bad, oneOf } from '../utils/validators.js';

export const profileRouter = Router();

profileRouter.get('/', requireIdentity, async (req, res, next) => {
    try {
        const u = await db.one('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!u) throw bad('Përdoruesi nuk u gjet.', 404, 'NOT_FOUND');
        const [wallet, reservations, chats] = await Promise.all([
            getOrCreateWallet(req.user.id),
            reservationHistoryForOwner(req.user.id),
            chatHistoryForOwner(req.user.id),
        ]);
        res.json({
            user: {
                id: u.id, name: u.full_name, email: u.email, phone: u.phone,
                role: u.role, emailVerified: !!u.email_verified, phoneVerified: !!u.phone_verified,
                savedPlate: u.saved_plate || '',
                createdAt: u.created_at,
            },
            wallet,
            reservations,
            chats,
        });
    } catch (e) { next(e); }
});

profileRouter.post('/verify/request', requireIdentity, authLimiter, async (req, res, next) => {
    try {
        const channel = oneOf(req.body?.channel, ['email', 'phone'], 'kanali');
        const code = await issueCode(req.user.id, channel);
        res.json({ requested: true, devCode: code });
    } catch (e) { next(e); }
});

profileRouter.post('/verify/confirm', requireIdentity, authLimiter, async (req, res, next) => {
    try {
        const channel = oneOf(req.body?.channel, ['email', 'phone'], 'kanali');
        const result = await verifyCode(req.user.id, channel, req.body?.code);
        res.json(result);
    } catch (e) { next(e); }
});

profileRouter.put('/plate', requireIdentity, async (req, res, next) => {
    try {
        const raw = String(req.body?.plate ?? '').trim().toUpperCase();
        const plate = raw.replace(/[^A-Z0-9\s-]/g, '').slice(0, 32) || null;
        await db.run('UPDATE users SET saved_plate = ? WHERE id = ?', [plate, req.user.id]);
        res.json({ savedPlate: plate || '' });
    } catch (e) { next(e); }
});
export default profileRouter;