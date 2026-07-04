// Pika e nisjes se serverit.
import { env } from './config/env.js';
import { migrate } from './db/schema.js';
import { seedIfEmpty } from './db/seed.js';
import { startExpiryJob } from './services/expiry.job.js';
import { engineName } from './db/connection.js';
import { createApp } from './app.js';

// Nisja eshte async: pergatit skemen dhe te dhenat para se te hapet serveri.
async function start() {
  await migrate();
  await seedIfEmpty();
  startExpiryJob();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`\n  🅿️  Parking System API  →  http://localhost:${env.port}/api`);
    console.log(`  Mjedisi: ${env.nodeEnv} | Baza: ${engineName}\n`);
  });
}

start().catch((e) => {
  console.error('[NISJA] Serveri nuk u nis:', e.message);
  process.exit(1);
});
