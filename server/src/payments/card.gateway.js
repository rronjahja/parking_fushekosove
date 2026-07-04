/**
 * ==========================  PLACEHOLDER  ==========================
 * Rimbushja e krediteve me karte bankare. Integrimi me procesuesin e
 * pagesave (Stripe, TEB, Raiffeisen, ose ekuivalent) NUK eshte i lidhur.
 * Te dhenat e kartes NUK ruhen dhe NUK dergohen askund - forma ne frontend
 * eshte vetem demonstrim vizual.
 *
 * PER PRODUKSION:
 *  1. Vendos CARD_PROVIDER_API_KEY ne .env.
 *  2. Perdor tokenizim ne ane te klientit (p.sh. Stripe Elements) qe
 *     numri i kartes te mos kaloje kurre neper serverin tuaj.
 *  3. Zevendeso `topUp` me krijimin real te pageses + verifikimin e saj.
 * ===================================================================
 */
export async function topUp({ euroCents }) {
  // TODO(INTEGRIM): thirrja reale e procesuesit te kartave shkon ketu.
  return {
    status: 'paid',
    reference: `KARTE-DEMO-${Date.now()}`,
    note: `Rimbushje e simuluar: ${(euroCents / 100).toFixed(2)}€`,
  };
}
