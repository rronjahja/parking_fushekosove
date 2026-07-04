// Validim i te dhenave hyrese. Cdo API duhet te validoje inputet (kerkesa e sigurise nr. 5).

export class ApiError extends Error {
  constructor(status, message, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const bad = (message, status = 400, code = 'BAD_REQUEST') =>
  new ApiError(status, message, code);

const PLATE_RE = /^[A-Z0-9]{1,3}(-[A-Z0-9]{1,4}){0,3}$/;

// Targa: p.sh. 02-236-GD. Normalizohet ne shkronja te medha, pa hapesira.
export function normalizePlate(raw) {
  if (typeof raw !== 'string') throw bad('Targa e makinës është e detyrueshme.');
  // Hiq gjithçka përveç shkronjave/shifrave, madhëso, pastaj rivendos vizat.
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const plate = clean.length === 7
    ? `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}`
    : raw.trim().toUpperCase();
  if (!PLATE_RE.test(plate)) {
    throw bad('Formati i targës nuk është i vlefshëm. Duhet: 0Y-XXX-ZZ (p.sh. 02-236-GD).');
  }
  return plate;
}

export function requireString(value, field, { max = 200, min = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw bad(`Fusha "${field}" nuk është e vlefshme.`);
  }
  return value.trim();
}

export function requireInt(value, field, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw bad(`Fusha "${field}" duhet të jetë numër i vlefshëm.`);
  }
  return n;
}

export function requireNumber(value, field, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw bad(`Fusha "${field}" duhet të jetë numër i vlefshëm.`);
  }
  return n;
}

const ZONE_ID_RE = /^P[0-9]{1,2}$/;
export function requireZoneId(value) {
  const id = requireString(value, 'zona', { max: 4 }).toUpperCase();
  if (!ZONE_ID_RE.test(id)) throw bad('ID e zonës duhet të jetë në formatin P1 ... P99.');
  return id;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) throw bad(`Vlera e "${field}" nuk lejohet.`);
  return value;
}

// ── Validime për regjistrimin e përdoruesve ──
export function requireEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw bad('Email-i nuk është i vlefshëm.', 400, 'BAD_EMAIL');
  }
  return email;
}

// Normalizon numrin e telefonit (Kosovë): pranon 044/045/048/049 etj. ose +383.
export function requirePhone(value) {
  let phone = String(value || '').trim().replace(/[\s\-()]/g, '');
  if (!/^\+?\d{6,15}$/.test(phone)) {
    throw bad('Numri i telefonit nuk është i vlefshëm.', 400, 'BAD_PHONE');
  }
  if (/^0\d{7,8}$/.test(phone)) phone = '+383' + phone.slice(1);
  return phone;
}

// Kërkon fjalëkalim me së paku 6 karaktere.
export function requirePassword(value) {
  const pw = String(value || '');
  if (pw.length < 6) throw bad('Fjalëkalimi duhet të ketë së paku 6 karaktere.', 400, 'WEAK_PASSWORD');
  if (pw.length > 100) throw bad('Fjalëkalimi është shumë i gjatë.', 400, 'BAD_REQUEST');
  return pw;
}