import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { signToken, requireIdentity } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { newId } from '../utils/id.js';
import {
  bad, requireString, requireEmail, requirePhone, requirePassword,
} from '../utils/validators.js';
import { audit } from '../services/audit.service.js';
import { issueCode } from '../services/verification.service.js';

export const authRouter = Router();

const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  name: u.full_name,
  email: u.email,
  phone: u.phone,
  emailVerified: !!u.email_verified,
  phoneVerified: !!u.phone_verified,
});

// ── Identitet vizitori (pa llogari) ──
// Rezervimi kërkon një identitet qe te lidhen vendi, pagesa dhe "Gjej veturën
// time". Kjo NUK eshte llogari: nuk ruhet asnje rresht ne baze, eshte vetem nje
// token qe mban nje id te rastesishem "guest:..." ne shfletuesin e vizitorit.
// Llogaria mbetet opsionale dhe sherben per historikun, kreditet dhe chat-in.
authRouter.post('/guest', (_req, res) => {
  const id = `guest:${newId()}`;
  res.status(201).json({
    token: signToken({ sub: id, role: 'GUEST', name: 'Vizitor' }, '30d'),
  });
});

// ── Regjistrimi i përdoruesve (email + telefon + fjalëkalim) ──
authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    const name = requireString(req.body?.name, 'emri', { max: 120 });
    const email = requireEmail(req.body?.email);
    const phone = requirePhone(req.body?.phone);
    const password = requirePassword(req.body?.password);

    const existing = await db.one(
      'SELECT id, email, phone FROM users WHERE email = ? OR phone = ?', [email, phone]
    );
    if (existing) {
      const which = existing.email === email ? 'Email-i' : 'Numri i telefonit';
      throw bad(`${which} është i regjistruar tashmë.`, 409, 'ALREADY_EXISTS');
    }

    const id = newId();
    await db.run(
      `INSERT INTO users (id, email, phone, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER')`,
      [id, email, phone, bcrypt.hashSync(password, 10), name]
    );
    await audit(id, 'USER_REGISTER', `user:${email}`);

    const emailCode = await issueCode(id, 'email');
    const phoneCode = await issueCode(id, 'phone');

    const user = await db.one('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json({
      token: signToken({ sub: id, role: 'CUSTOMER', name }),
      user: publicUser(user),
      devCodes: { email: emailCode, phone: phoneCode },
    });
  } catch (e) { next(e); }
});

// ── Kyçja: me email OSE numër telefoni + fjalëkalim ──
authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const identifier = requireString(req.body?.identifier, 'email ose telefoni', { max: 160 }).trim();
    const password = requireString(req.body?.password, 'fjalëkalimi', { max: 100 });

    const lower = identifier.toLowerCase();
    let normalizedPhone = null;
    try { normalizedPhone = requirePhone(identifier); } catch { /* s'është telefon */ }

    const user = await db.one(
      'SELECT * FROM users WHERE email = ? OR phone = ? OR username = ?',
      [lower, normalizedPhone || identifier, lower]
    );
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw bad('Kredencialet janë të pasakta.', 401, 'BAD_CREDENTIALS');
    }
    await audit(user.id, 'LOGIN', `user:${user.email || user.username}`);
    res.json({
      token: signToken({ sub: user.id, role: user.role, name: user.full_name }),
      user: publicUser(user),
    });
  } catch (e) { next(e); }
});

authRouter.get('/me', requireIdentity, async (req, res, next) => {
  try {
    const u = await db.one('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!u) throw bad('Përdoruesi nuk u gjet.', 404, 'NOT_FOUND');
    res.json({ user: publicUser(u) });
  } catch (e) { next(e); }
});

export default authRouter;