/**
 * ==========================  PLACEHOLDER  ==========================
 * Pagesa permes Aparatit (terminalit fizik). Integrimi real NUK eshte
 * i lidhur - kthehet konfirmim i simuluar.
 *
 * PER PRODUKSION:
 *  - Rrjedha e rekomanduar nga specifikimi: rezervimi krijohet "pending",
 *    aparati konfirmon pagesen (webhook / polling drejt aparatit), dhe
 *    statusi kalon "active". Nese s'konfirmohet brenda X minutash,
 *    vendi lirohet automatikisht (shih expiry.job.js - PENDING_TIMEOUT).
 * ===================================================================
 */
export async function charge({ plate, zoneId, spotNumber, euroCents }) {
  // TODO(INTEGRIM): lidhja me protokollin e aparatit shkon ketu.
  return {
    status: 'paid',
    reference: `APARAT-DEMO-${Date.now()}`,
    note: `Pagesë në aparat e simuluar: ${plate} | ${zoneId}/${spotNumber} | ${(euroCents / 100).toFixed(2)}€`,
  };
}
