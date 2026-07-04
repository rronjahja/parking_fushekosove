// Menaxhimi i bilancit te krediteve. Bilanci verifikohet GJITHMONE ne backend
// (kerkesa e sigurise nr. 2) dhe cdo levizje regjistrohet ne histori.
import { db } from '../db/connection.js';
import { env } from '../config/env.js';
import { newId } from '../utils/id.js';
import { CREDITS_PER_EURO } from '../config/tariffs.js';
import { bad } from '../utils/validators.js';

// Siguron ekzistencen e kuletes. Pranon opsionalisht nje kontekst transaksioni
// "t" (nga db.tx) qe leximet/shkrimet te ndodhin brenda te njejtit transaksion.
export async function ensureWallet(ownerId, t = db) {
  const w = await t.one('SELECT owner_id FROM wallets WHERE owner_id = ?', [ownerId]);
  if (!w) {
    await t.run('INSERT INTO wallets (owner_id, balance_credits) VALUES (?, ?)', [
      ownerId,
      env.demoStartingCredits,
    ]);
    if (env.demoStartingCredits > 0) {
      await t.run(
        'INSERT INTO wallet_transactions (id, owner_id, delta_credits, reason) VALUES (?, ?, ?, ?)',
        [newId(), ownerId, env.demoStartingCredits, 'Bilanc fillestar (demo)']
      );
    }
  }
}

export async function getOrCreateWallet(ownerId) {
  await ensureWallet(ownerId);
  const w = await db.one('SELECT * FROM wallets WHERE owner_id = ?', [ownerId]);
  return {
    ownerId: w.owner_id,
    balanceCredits: w.balance_credits,
    equivalentEuroCents: Math.round((w.balance_credits / CREDITS_PER_EURO) * 100),
    updatedAt: w.updated_at,
  };
}

// Perdoret BRENDA nje transaksioni (kalohet konteksti "t").
export async function debitCredits(t, ownerId, credits, reason) {
  await ensureWallet(ownerId, t);
  const w = await t.one('SELECT balance_credits FROM wallets WHERE owner_id = ?', [ownerId]);
  const balance = w ? w.balance_credits : 0;
  if (balance < credits) {
    throw bad(
      `Bilanci nuk mjafton: keni ${balance} kredite, kërkohen ${credits}. Rimbushni kreditet.`,
      402,
      'INSUFFICIENT_CREDITS'
    );
  }
  await t.run(
    'UPDATE wallets SET balance_credits = balance_credits - ? WHERE owner_id = ?',
    [credits, ownerId]
  );
  await t.run(
    'INSERT INTO wallet_transactions (id, owner_id, delta_credits, reason) VALUES (?, ?, ?, ?)',
    [newId(), ownerId, -credits, reason]
  );
}

export async function creditCredits(ownerId, credits, reason) {
  await ensureWallet(ownerId);
  await db.run(
    'UPDATE wallets SET balance_credits = balance_credits + ? WHERE owner_id = ?',
    [credits, ownerId]
  );
  await db.run(
    'INSERT INTO wallet_transactions (id, owner_id, delta_credits, reason) VALUES (?, ?, ?, ?)',
    [newId(), ownerId, credits, reason]
  );
}

export async function walletHistory(ownerId, limit = 20) {
  return db.query(
    `SELECT id, delta_credits AS deltaCredits, reason, created_at AS createdAt
     FROM wallet_transactions WHERE owner_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`,
    [ownerId, Number(limit) || 20]
  );
}
