// Backup & Restore i bazes se te dhenave MySQL (seksioni 2.2 + endpoint-et admin).
// Backup: "logical dump" - nje skedar .sql me te gjitha tabelat/rreshtat, i
// ruajtur ne dosjen /backups + checksum SHA-256.
// Restore: ekzekuton perseri skedarin .sql (fshin dhe rimbush tabelat) - pa
// pasur nevoje per mjete te jashtme si mysqldump.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { db } from '../db/connection.js';
import { env } from '../config/env.js';
import { newId } from '../utils/id.js';
import { audit } from './audit.service.js';
import { bad } from '../utils/validators.js';

// Rendi i tabelave respekton varesite e celesave te huaj (per import).
const TABLES = [
  'users', 'zones', 'spots', 'wallets', 'wallet_transactions',
  'payments', 'reservations', 'chats', 'chat_messages', 'audit_logs', 'backup_logs',
];

const sqlValue = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

async function dumpToSql() {
  let out = 'SET FOREIGN_KEY_CHECKS=0;\n';
  for (const table of TABLES) {
    const rows = await db.query(`SELECT * FROM \`${table}\``);
    out += `\nDELETE FROM \`${table}\`;\n`;
    if (rows.length) {
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `\`${c}\``).join(', ');
      for (const r of rows) {
        const vals = cols.map((c) => sqlValue(r[c])).join(', ');
        out += `INSERT INTO \`${table}\` (${colList}) VALUES (${vals});\n`;
      }
    }
  }
  out += '\nSET FOREIGN_KEY_CHECKS=1;\n';
  return out;
}

export async function createBackup(actor) {
  const id = newId();
  const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const filename = `backup-${startedAt.replace(/[: ]/g, '-')}.sql`;
  const dest = path.join(env.backupDir, filename);

  await db.run(
    'INSERT INTO backup_logs (id, backup_type, status, started_at, created_by) VALUES (?, ?, ?, ?, ?)',
    [id, 'full', 'pending', startedAt, actor]
  );

  try {
    const sql = await dumpToSql();
    fs.writeFileSync(dest, sql, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    await db.run(
      "UPDATE backup_logs SET status = 'completed', completed_at = NOW(), storage_location = ?, checksum = ? WHERE id = ?",
      [dest, checksum, id]
    );
    await audit(actor, 'DATABASE_BACKUP', `backup:${id}`, { dest });
    return { id, storageLocation: dest, checksum, status: 'completed' };
  } catch (e) {
    await db.run("UPDATE backup_logs SET status = 'failed', completed_at = NOW() WHERE id = ?", [id]);
    throw e;
  }
}

export async function listBackups() {
  return db.query(
    `SELECT id, backup_type AS backupType, status, started_at AS startedAt,
            completed_at AS completedAt, storage_location AS storageLocation,
            created_by AS createdBy, checksum
     FROM backup_logs ORDER BY started_at DESC LIMIT 50`
  );
}

// Rikthimi aplikohet MENJEHERE (ekzekuton skedarin .sql brenda nje lidhjeje).
export async function restoreBackup(actor, backupId) {
  const b = await db.one('SELECT * FROM backup_logs WHERE id = ?', [backupId]);
  if (!b || b.status !== 'completed' || !b.storage_location || !fs.existsSync(b.storage_location)) {
    throw bad('Backup-i i kërkuar nuk ekziston ose nuk është i plotë.', 404, 'NOT_FOUND');
  }
  const sql = fs.readFileSync(b.storage_location, 'utf8');
  await db.exec(sql); // multipleStatements = true ne pool
  await audit(actor, 'DATABASE_RESTORE', `backup:${backupId}`, { file: b.storage_location });
  return {
    restored: true,
    message: 'Baza u rikthye me sukses nga kopja e zgjedhur.',
  };
}
