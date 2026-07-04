// Autentikimi me JWT dhe autorizimi sipas roleve.
// Paneli administrativ hapet VETEM per role administrative (kerkesa nr. 11-12).
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/validators.js';

export function signToken(payload, expiresIn = '15d') {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}


function parseToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

// Kerkon nje identitet (vizitor anonim OSE staf i kyçur).
export function requireIdentity(req, _res, next) {
  const claims = parseToken(req);
  if (!claims) return next(new ApiError(401, 'Sesioni mungon ose ka skaduar.', 'UNAUTHORIZED'));
  req.user = { id: claims.sub, role: claims.role, name: claims.name };
  next();
}

// Kerkon nje nga rolet e stafit te dhena.
export function requireRole(...roles) {
  return (req, _res, next) => {
    const claims = parseToken(req);
    if (!claims) return next(new ApiError(401, 'Kërkohet kyçja e stafit.', 'UNAUTHORIZED'));
    if (!roles.includes(claims.role)) {
      return next(new ApiError(403, 'Nuk keni të drejta për këtë veprim.', 'FORBIDDEN'));
    }
    req.user = { id: claims.sub, role: claims.role, name: claims.name };
    next();
  };
}
