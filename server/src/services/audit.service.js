// Regjistri i auditimit per veprimet kritike (kerkesa e sigurise nr. 16).
import { db } from '../db/connection.js';
import { newId } from '../utils/id.js';

export async function audit(actor, action, entity = null, details = null) {
  await db.run(
    'INSERT INTO audit_logs (id, actor, action, entity, details) VALUES (?, ?, ?, ?, ?)',
    [newId(), actor, action, entity, details ? JSON.stringify(details) : null]
  );
}

export async function listAuditLogs({ limit = 100 } = {}) {
  return db.query(
    'SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ?',
    [Math.min(Number(limit) || 100, 500)]
  );
}
