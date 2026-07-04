// Tarifat e parkimit. Burimi autoritar eshte VETEM backend-i:
// frontend-i i shfaq, por cmimi verifikohet ketu (rregulli i sigurise nr. 1).
// 100 kredite = 1.00 EUR

export const CREDITS_PER_EURO = 100;

export const TARIFFS = [
  { key: 'h1',  label: '1 orë',  minutes: 60,        euroCents: 50,  credits: 50 },
  { key: 'h2',  label: '2 orë',  minutes: 120,       euroCents: 100, credits: 100 },
  { key: 'h3',  label: '3 orë',  minutes: 180,       euroCents: 150, credits: 150 },
  { key: 'h24', label: '24h',    minutes: 24 * 60,   euroCents: 500, credits: 500 },
];

export function getTariff(key) {
  return TARIFFS.find((t) => t.key === key) || null;
}
