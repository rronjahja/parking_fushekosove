// Diagnostikë e shpejtë e lidhjes me MySQL.
// Ekzekutohet me:  npm run doctor
import { env } from '../config/env.js';

const line = (s = '') => console.log(s);
line('\n──────────────────────────────────────────────');
line('  Parking System · Diagnostikë e MySQL (doctor)');
line('──────────────────────────────────────────────');
line(`  Node.js:   ${process.version}`);
line(`  Host:      ${env.mysql.host}:${env.mysql.port}`);
line(`  Baza:      ${env.mysql.database}`);
line(`  User:      ${env.mysql.user}`);
line('');

let ok = false;
try {
  const mysql = (await import('mysql2/promise')).default;
  const conn = await mysql.createConnection({
    host: env.mysql.host, port: env.mysql.port,
    user: env.mysql.user, password: env.mysql.password,
  });
  const [[v]] = await conn.query('SELECT VERSION() AS v');
  line(`  ✔  Lidhja me serverin MySQL PUNON  (versioni: ${v.v})`);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.mysql.database}\` CHARACTER SET utf8mb4`
  );
  line(`  ✔  Baza "${env.mysql.database}" ekziston / u krijua.`);
  await conn.end();
  ok = true;
} catch (e) {
  line(`  ✖  Lidhja DESHTOI: ${e.code || ''} ${e.message}`);
  line('');
  line('  Kontrollo që:');
  line('   1) Serveri MySQL/MariaDB është duke punuar (XAMPP → Start MySQL).');
  line('   2) Kredencialet te server/.env janë të sakta.');
  line('   3) Porti 3306 nuk është i bllokuar.');
}
line('──────────────────────────────────────────────\n');
process.exit(ok ? 0 : 1);
