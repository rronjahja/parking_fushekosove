import { ApiError } from '../utils/validators.js';

// Trajtimi qendror i gabimeve: mesazhe te qarta per perdoruesin,
// pa ekspozuar detaje te brendshme (kerkesa e sigurise nr. 9).
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Ndodhi një gabim i brendshëm. Provoni përsëri.', code: 'INTERNAL' });
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Rruga e kërkuar nuk ekziston.', code: 'NOT_FOUND' });
}
