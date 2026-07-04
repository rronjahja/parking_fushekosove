/**
 * ==========================  PLACEHOLDER  ==========================
 * Gateway i pageses me SMS. Lidhja me operatorin (Vala, IPKO, ose
 * ekuivalent) NUK eshte e aktivizuar. Ky modul kthen nje pergjigje te
 * simuluar "sukses" qe rrjedha e rezervimit te jete plotesisht funksionale.
 *
 * PER PRODUKSION:
 *  1. Vendos SMS_GATEWAY_API_KEY ne .env (kurre ne kod).
 *  2. Zevendeso trupin e funksionit `charge` me thirrjen reale te API-se.
 *  3. Nese operatori kerkon konfirmim asinkron, kthe { status: 'pending' }
 *     dhe konfirmoje permes nje webhook-u (shto route: POST /api/payments/sms/webhook).
 * ===================================================================
 */
export async function charge({ plate, zoneId, spotNumber, euroCents }) {
  // TODO(INTEGRIM): thirrja reale e SMS gateway-t shkon ketu.
  return {
    status: 'paid',
    reference: `SMS-DEMO-${Date.now()}`,
    note: `Pagesë SMS e simuluar: ${plate} | ${zoneId}/${spotNumber} | ${(euroCents / 100).toFixed(2)}€`,
  };
}
