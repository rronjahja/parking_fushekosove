import { Router } from 'express';
import { requireIdentity } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';
import { getOrCreateWallet, creditCredits, walletHistory } from '../services/wallet.service.js';
import { requireInt } from '../utils/validators.js';
import { topUp } from '../payments/card.gateway.js';
import { db } from '../db/connection.js';
import { newId } from '../utils/id.js';
import { audit } from '../services/audit.service.js';
import { CREDITS_PER_EURO } from '../config/tariffs.js';

export const walletRouter = Router();

walletRouter.get('/', requireIdentity, async (req, res, next) => {
  try {
    res.json({ wallet: await getOrCreateWallet(req.user.id), history: await walletHistory(req.user.id) });
  } catch (e) { next(e); }
});

// Rimbushja e krediteve. Pagesa me karte eshte PLACEHOLDER (shih payments/card.gateway.js).
walletRouter.post('/top-up', requireIdentity, paymentLimiter, async (req, res, next) => {
  try {
    const euro = requireInt(req.body?.euro, 'shuma', { min: 1, max: 500 });
    const euroCents = euro * 100;
    const credits = euro * CREDITS_PER_EURO;

    const result = await topUp({ euroCents }); // <- placeholder i kartes
    if (result.status !== 'paid') {
      return res.status(402).json({ error: 'Pagesa nuk u konfirmua.', code: 'PAYMENT_FAILED' });
    }

    await db.run(
      `INSERT INTO payments (id, method, amount_cents, amount_credits, status, owner_id, reference)
       VALUES (?, 'card', ?, ?, 'paid', ?, ?)`,
      [newId(), euroCents, credits, req.user.id, result.reference]
    );
    await creditCredits(req.user.id, credits, `Rimbushje kredish (${euro}.00€)`);
    await audit(req.user.id, 'WALLET_TOPUP', null, { euro, credits });

    res.json({ wallet: await getOrCreateWallet(req.user.id), added: credits });
  } catch (e) { next(e); }
});
