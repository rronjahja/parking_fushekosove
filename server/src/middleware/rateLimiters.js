// Rate limiting per endpoint-et kritike (kerkesa e sigurise nr. 19):
// pagesat, rezervimet, autentikimi dhe chat-i.
import rateLimit from 'express-rate-limit';

const json = (msg) => ({ error: msg, code: 'RATE_LIMITED' });

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 1500, // i gjere: aplikacioni ben polling cdo 2 sekonda
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Shumë kërkesa. Prisni një moment.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  message: json('Shumë tentativa kyçjeje. Provoni pas 15 minutash.'),
});

export const paymentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  message: json('Shumë kërkesa pagese. Prisni një moment.'),
});

export const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  message: json('Shumë mesazhe. Prisni një moment.'),
});
