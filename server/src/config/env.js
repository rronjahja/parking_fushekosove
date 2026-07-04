// Konfigurimi qendror i mjedisit.
// Sekretet NUK vendosen ne kod - lexohen nga variablat e mjedisit (.env).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

// Ngarkues minimal i .env (pa varesi shtese)
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-vetem-per-zhvillim',
  nodeEnv: process.env.NODE_ENV || 'development',
  demoStartingCredits: Number(process.env.DEMO_STARTING_CREDITS ?? 0),
  // Lidhja me MySQL/MariaDB (parazgjedhjet punojne me XAMPP/MySQL lokal).
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE || 'parking_system',
    // Opsionale: lidhu përmes socket-i lokal në vend të TCP (p.sh. disa XAMPP/Linux).
    socketPath: process.env.MYSQL_SOCKET || undefined,
  },
  backupDir: path.join(rootDir, 'backups'),
};

fs.mkdirSync(env.backupDir, { recursive: true });
