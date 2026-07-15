// Country -> emoji flag resolution. The loaded dataset stores full country
// names (e.g. "Russia"); the static seed data stores ISO alpha-2 codes
// (e.g. "UA"). Both are handled: 2-letter input is treated as ISO, longer
// input is mapped by name. No images required — emoji flags are enough.
const NAME_TO_ISO = {
  russia: 'RU', ukraine: 'UA', france: 'FR', denmark: 'DK', sweden: 'SE',
  brazil: 'BR', 'united states': 'US', usa: 'US', america: 'US', germany: 'DE',
  poland: 'PL', finland: 'FI', norway: 'NO', 'bosnia and herzegovina': 'BA',
  bosnia: 'BA', slovakia: 'SK', czechia: 'CZ', 'czech republic': 'CZ',
  estonia: 'EE', latvia: 'LV', lithuania: 'LT', kazakhstan: 'KZ', turkey: 'TR',
  'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', england: 'GB',
  canada: 'CA', australia: 'AU', 'saudi arabia': 'SA', china: 'CN',
  mongolia: 'MN', israel: 'IL', spain: 'ES', portugal: 'PT', netherlands: 'NL',
  belgium: 'BE', serbia: 'RS', romania: 'RO', bulgaria: 'BG', hungary: 'HU',
  slovenia: 'SI', croatia: 'HR', austria: 'AT', switzerland: 'CH',
  argentina: 'AR', chile: 'CL', indonesia: 'ID', thailand: 'TH', jordan: 'JO',
  belarus: 'BY', georgia: 'GE', armenia: 'AM', azerbaijan: 'AZ', iceland: 'IS',
  ireland: 'IE', italy: 'IT', greece: 'GR', 'north macedonia': 'MK',
  montenegro: 'ME', 'south korea': 'KR', korea: 'KR', japan: 'JP',
  india: 'IN', 'new zealand': 'NZ', mexico: 'MX', uruguay: 'UY', peru: 'PE',
};

function isoToEmoji(iso) {
  if (!iso || iso.length !== 2) return '';
  const base = 0x1f1e6;
  const a = iso.toUpperCase().charCodeAt(0) - 65;
  const b = iso.toUpperCase().charCodeAt(1) - 65;
  if (a < 0 || a > 25 || b < 0 || b > 25) return '';
  return String.fromCodePoint(base + a) + String.fromCodePoint(base + b);
}

export function countryToFlag(country) {
  if (!country) return { emoji: '🏳', code: '—' };
  const raw = String(country).trim();
  let iso = null;
  if (/^[A-Za-z]{2}$/.test(raw)) iso = raw.toUpperCase();
  else iso = NAME_TO_ISO[raw.toLowerCase()] || null;
  const emoji = iso ? isoToEmoji(iso) : '';
  const code = iso || raw.slice(0, 3).toUpperCase();
  return { emoji: emoji || '🏳', code };
}
