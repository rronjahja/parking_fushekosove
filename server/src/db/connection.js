// Lidhja e vetme me bazen e te dhenave MySQL/MariaDB.
//
// Perdoret drejtuesi "mysql2" (100% JavaScript - pa kompilime native), keshtu
// qe funksionon me cdo version te Node.js (16+). MySQL eshte zgjedhje
// "ekuivalente" sipas specifikimit: relacionale, me transaksione ACID.
//
// Kredencialet lexohen nga .env (shih .env.example). Baza dhe tabelat krijohen
// automatikisht ne nisjen e pare - nuk kerkohet konfigurim manual i skemave.
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const engineName = `MySQL (${env.mysql.host}:${env.mysql.port}/${env.mysql.database})`;

// Krijon bazen nese nuk ekziston, pastaj hap nje pool te lidhur me te.
async function createPool() {
  // Lidhje fillestare pa zgjedhur baze - per te siguruar ekzistencen e saj.
  const bootstrap = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    socketPath: env.mysql.socketPath,
    user: env.mysql.user,
    password: env.mysql.password,
    multipleStatements: true,
  });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.mysql.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  return mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    socketPath: env.mysql.socketPath,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    multipleStatements: true, // e nevojshme per migrimin e skemes (schema.js)
    dateStrings: true,        // datat kthehen si string 'YYYY-MM-DD HH:MM:SS'
  });
}

let pool;
try {
  pool = await createPool();
  // Test i shpejte i lidhjes qe deshtimet te dalin sa me heret.
  const c = await pool.getConnection();
  c.release();
} catch (e) {
  console.error(`
  ✖  Nuk u lidh dot me MySQL.

  Adresa:  ${env.mysql.host}:${env.mysql.port}
  Baza:    ${env.mysql.database}
  User:    ${env.mysql.user}

  Arsyeja: ${e.code || ''} ${e.message}

  Kontrollo qe:
    1) Serveri MySQL/MariaDB është duke punuar (p.sh. XAMPP → Start MySQL).
    2) Kredencialet te server/.env janë të sakta
       (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).
    3) Përdoruesi ka të drejtë të krijojë/qaset në bazën "${env.mysql.database}".
`);
  process.exit(1);
}

/**
 * Nderfaqe e vogel dhe e qarte (e gjitha async):
 *   query(sql, params)      -> te gjitha rreshtat
 *   one(sql, params)        -> rreshti i pare ose undefined
 *   run(sql, params)        -> { insertId, affectedRows }
 *   exec(sql)               -> ekzekuton SQL me shume deklarata (migrim)
 *   tx(async (t) => {...})  -> transaksion; brenda perdor t.query/t.one/t.run
 */
export const db = {
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async one(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },
  async run(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },
  async exec(sql) {
    await pool.query(sql);
  },
  async tx(fn) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const t = {
        async query(sql, params = []) { const [r] = await conn.query(sql, params); return r; },
        async one(sql, params = []) { const [r] = await conn.query(sql, params); return r[0]; },
        async run(sql, params = []) {
          const [r] = await conn.query(sql, params);
          return { insertId: r.insertId, affectedRows: r.affectedRows };
        },
      };
      const result = await fn(t);
      await conn.commit();
      return result;
    } catch (e) {
      try { await conn.rollback(); } catch { /* injoro */ }
      throw e;
    } finally {
      conn.release();
    }
  },
  get pool() { return pool; },
};
