// Formatues të vegjël, të përdorur kudo.
export const euro = (cents) => `${(cents / 100).toFixed(2)}€`;
export const timeHM = (iso) =>
  new Date(iso).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
export const dateDMY = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};
export const methodLabel = (m) =>
  ({ sms: 'SMS', terminal: 'Aparat', credits: 'Kredi', card: 'Kartelë' }[m] || m);
export const statusLabel = (s) =>
  ({ active: 'Aktiv', expired: 'Skaduar', cancelled: 'Anuluar', pending: 'Në pritje' }[s] || s);
export const coordsText = ({ lat, lng }) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
