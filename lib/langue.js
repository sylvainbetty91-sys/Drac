import fs from 'node:fs';
import path from 'node:path';
import fr from '../langues/fr.js';
import en from '../langues/en.js';
import es from '../langues/es.js';
import { planifierLangues } from './github.js';

export const LANGUES = { fr, en, es };

// Un enregistrement par numéro connecté : les sessions ne s'influencent pas
const FICHIER = path.join(process.env.SESSIONS_DIR || './sessions', 'langues.json');

function lire() {
  try {
    return JSON.parse(fs.readFileSync(FICHIER, 'utf-8'));
  } catch {
    return {};
  }
}

function ecrire(data) {
  fs.mkdirSync(path.dirname(FICHIER), { recursive: true });
  fs.writeFileSync(FICHIER, JSON.stringify(data));
  planifierLangues(path.dirname(FICHIER)); // copie sur GitHub : la langue survit aux redémarrages
}

function entree(number) {
  const v = lire()[number];
  if (!v) return {};
  return typeof v === 'string' ? { lang: v } : v; // compatible avec l'ancien format
}

// Renvoie 'fr' | 'en' | 'es', ou null si le numéro n'a encore rien choisi
export function getLang(number) {
  return entree(number).lang ?? null;
}

export function setLang(number, lang) {
  const data = lire();
  data[number] = { ...entree(number), lang };
  ecrire(data);
}

// Le message de bienvenue a-t-il déjà été envoyé à ce numéro ?
export function accueilEnvoye(number) {
  return Boolean(entree(number).accueil);
}

export function marquerAccueil(number) {
  const data = lire();
  data[number] = { ...entree(number), accueil: true };
  ecrire(data);
}

// Textes de la langue (français par défaut)
export function textes(lang) {
  return LANGUES[lang] ?? LANGUES.fr;
}

// Message de bienvenue, dans les 3 langues
export function messageAccueil(prefix) {
  return (
`👋 𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚞𝚎 / 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 / 𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚒𝚍𝚘

🇫🇷 𝚅𝚎𝚞𝚒𝚕𝚕𝚎𝚣 𝚌𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚎𝚛 𝚟𝚘𝚝𝚛𝚎 𝚕𝚊𝚗𝚐𝚞𝚎 𝚙𝚘𝚞𝚛 𝚙𝚘𝚞𝚟𝚘𝚒𝚛 𝚞𝚝𝚒𝚕𝚒𝚜𝚎𝚛 𝚕𝚎 𝚋𝚘𝚝.
𝚃𝚊𝚙𝚎𝚣 ${prefix}fr 𝚙𝚘𝚞𝚛 𝚕𝚎 𝚏𝚛𝚊𝚗𝚌̧𝚊𝚒𝚜

🇬🇧 𝙿𝚕𝚎𝚊𝚜𝚎 𝚜𝚎𝚝 𝚢𝚘𝚞𝚛 𝚕𝚊𝚗𝚐𝚞𝚊𝚐𝚎 𝚝𝚘 𝚞𝚜𝚎 𝚝𝚑𝚎 𝚋𝚘𝚝.
𝚃𝚢𝚙𝚎 ${prefix}en 𝚏𝚘𝚛 𝙴𝚗𝚐𝚕𝚒𝚜𝚑

🇪🇸 𝙿𝚘𝚛 𝚏𝚊𝚟𝚘𝚛, 𝚌𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊 𝚝𝚞 𝚒𝚍𝚒𝚘𝚖𝚊 𝚙𝚊𝚛𝚊 𝚙𝚘𝚍𝚎𝚛 𝚞𝚜𝚊𝚛 𝚎𝚕 𝚋𝚘𝚝.
𝙴𝚜𝚌𝚛𝚒𝚋𝚎 ${prefix}es 𝚙𝚊𝚛𝚊 𝚎𝚜𝚙𝚊𝚗̃𝚘𝚕`
  );
}
