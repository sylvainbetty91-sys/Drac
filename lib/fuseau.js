// Fuseau horaire déduit de l'indicatif du numéro WhatsApp (ex. 509... → Haïti)
// Pour les pays à plusieurs fuseaux, on prend le fuseau principal.
const FUSEAUX = {
  // Amérique du Nord, Caraïbes (indicatif 1 + code régional)
  1: 'America/New_York',
  1242: 'America/Nassau', 1246: 'America/Barbados', 1658: 'America/Jamaica',
  1787: 'America/Puerto_Rico', 1809: 'America/Santo_Domingo', 1829: 'America/Santo_Domingo',
  1849: 'America/Santo_Domingo', 1868: 'America/Port_of_Spain', 1876: 'America/Jamaica',
  1939: 'America/Puerto_Rico',
  509: 'America/Port-au-Prince', 590: 'America/Guadeloupe', 596: 'America/Martinique',
  594: 'America/Cayenne', 53: 'America/Havana',
  // Amérique centrale et du Sud
  52: 'America/Mexico_City', 501: 'America/Belize', 502: 'America/Guatemala',
  503: 'America/El_Salvador', 504: 'America/Tegucigalpa', 505: 'America/Managua',
  506: 'America/Costa_Rica', 507: 'America/Panama', 51: 'America/Lima',
  54: 'America/Argentina/Buenos_Aires', 55: 'America/Sao_Paulo', 56: 'America/Santiago',
  57: 'America/Bogota', 58: 'America/Caracas', 591: 'America/La_Paz',
  593: 'America/Guayaquil', 595: 'America/Asuncion', 598: 'America/Montevideo',
  // Europe
  30: 'Europe/Athens', 31: 'Europe/Amsterdam', 32: 'Europe/Brussels', 33: 'Europe/Paris',
  34: 'Europe/Madrid', 351: 'Europe/Lisbon', 352: 'Europe/Luxembourg', 353: 'Europe/Dublin',
  377: 'Europe/Monaco', 39: 'Europe/Rome', 40: 'Europe/Bucharest', 41: 'Europe/Zurich',
  44: 'Europe/London', 45: 'Europe/Copenhagen', 46: 'Europe/Stockholm', 47: 'Europe/Oslo',
  48: 'Europe/Warsaw', 49: 'Europe/Berlin', 7: 'Europe/Moscow', 90: 'Europe/Istanbul',
  // Afrique
  20: 'Africa/Cairo', 212: 'Africa/Casablanca', 213: 'Africa/Algiers', 216: 'Africa/Tunis',
  221: 'Africa/Dakar', 223: 'Africa/Bamako', 224: 'Africa/Conakry', 225: 'Africa/Abidjan',
  226: 'Africa/Ouagadougou', 227: 'Africa/Niamey', 228: 'Africa/Lome', 229: 'Africa/Porto-Novo',
  230: 'Indian/Mauritius', 233: 'Africa/Accra', 234: 'Africa/Lagos', 235: 'Africa/Ndjamena',
  237: 'Africa/Douala', 241: 'Africa/Libreville', 242: 'Africa/Brazzaville',
  243: 'Africa/Kinshasa', 254: 'Africa/Nairobi', 261: 'Indian/Antananarivo',
  262: 'Indian/Reunion', 27: 'Africa/Johannesburg',
  // Asie, Océanie
  60: 'Asia/Kuala_Lumpur', 61: 'Australia/Sydney', 62: 'Asia/Jakarta', 63: 'Asia/Manila',
  64: 'Pacific/Auckland', 65: 'Asia/Singapore', 66: 'Asia/Bangkok', 81: 'Asia/Tokyo',
  82: 'Asia/Seoul', 84: 'Asia/Ho_Chi_Minh', 86: 'Asia/Shanghai', 91: 'Asia/Kolkata',
  92: 'Asia/Karachi', 961: 'Asia/Beirut', 966: 'Asia/Riyadh', 971: 'Asia/Dubai',
  972: 'Asia/Jerusalem',
};

// Cherche l'indicatif le plus précis (4 chiffres, puis 3, 2, 1). Inconnu → UTC.
export function fuseauDe(number) {
  const n = String(number).replace(/\D/g, '');
  for (let len = 4; len >= 1; len--) {
    const zone = FUSEAUX[n.slice(0, len)];
    if (zone) return zone;
  }
  return 'UTC';
}
