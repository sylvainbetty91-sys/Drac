import fs from 'node:fs';
import path from 'node:path';
import fr from '../langues/fr.js';
import en from '../langues/en.js';
import es from '../langues/es.js';

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
`👋 Bienvenue / Welcome / Bienvenido

🇫🇷 Veuillez configurer votre langue pour pouvoir utiliser le bot.
Tapez ${prefix}fr pour le français

🇬🇧 Please set your language to use the bot.
Type ${prefix}en for English

🇪🇸 Por favor, configura tu idioma para poder usar el bot.
Escribe ${prefix}es para español`
  );
}
