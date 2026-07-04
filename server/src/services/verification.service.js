// Verifikimi i email-it / telefonit me kod.
// TANI: gjeneron dhe ruan kodin (6 shifra), skadon për 15 min.
// MË VONË: lidhet dërgimi real (email SMTP / SMS gateway) — shih TODO më poshtë.
import { db } from '../db/connection.js';
import { newId } from '../utils/id.js';
import { bad } from '../utils/validators.js';

const CODE_TTL_MIN = 15;

function sixDigits() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueCode(userId, channel) {
    const code = sixDigits();
    const expires = new Date(Date.now() + CODE_TTL_MIN * 60_000)
        .toISOString().slice(0, 19).replace('T', ' ');
    await db.run(
        'INSERT INTO verification_codes (id, user_id, channel, code, expires_at) VALUES (?, ?, ?, ?, ?)',
        [newId(), userId, channel, code, expires]
    );

    // TODO(INTEGRIM): dërgo kodin real te përdoruesi.
    //   • email  → shërbim SMTP (p.sh. nodemailer) ose ofrues si SendGrid/Mailgun
    //   • telefon → SMS gateway (Vala/IPKO ose Twilio)
    console.log(`[VERIFY] Kodi ${channel} për ${userId}: ${code} (demo)`);
    return code;
}

export async function verifyCode(userId, channel, code) {
    const row = await db.one(
        `SELECT * FROM verification_codes
     WHERE user_id = ? AND channel = ? AND code = ? AND consumed_at IS NULL
       AND expires_at >= NOW()
     ORDER BY created_at DESC LIMIT 1`,
        [userId, channel, String(code).trim()]
    );
    if (!row) throw bad('Kodi është i pavlefshëm ose ka skaduar.', 400, 'BAD_CODE');

    await db.run('UPDATE verification_codes SET consumed_at = NOW() WHERE id = ?', [row.id]);
    const column = channel === 'email' ? 'email_verified' : 'phone_verified';
    await db.run(`UPDATE users SET ${column} = 1 WHERE id = ?`, [userId]);
    return { channel, verified: true };
}