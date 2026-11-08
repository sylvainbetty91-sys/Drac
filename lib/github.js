// Sauvegarde des sessions WhatsApp dans un dépôt GitHub PRIVÉ (via l'API, sans paquet en plus).
// Variables Render : GITHUB_TOKEN, GITHUB_REPO (ex. monpseudo/drac-sessions), GITHUB_BRANCH (défaut : main)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPO || '';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export const actif = Boolean(TOKEN && REPO);

const shas = new Map();      // chemin -> sha du fichier sur GitHub
const derniers = new Map();  // chemin -> empreinte du dernier contenu envoyé
const minuteries = new Map();
let file = Promise.resolve(); // toutes les opérations GitHub passent une par une, dans l'ordre

function enfiler(fn) {
  file = file.then(fn).catch((e) => console.error('[github]', e.message));
  return file;
}

const empreinte = (texte) => crypto.createHash('sha1').update(texte).digest('hex');

function api(methode, chemin, body = null, brut = false) {
  const ref = methode === 'GET' ? `?ref=${encodeURIComponent(BRANCH)}` : '';
  return fetch(`https://api.github.com/repos/${REPO}/contents/${chemin}${ref}`, {
    method: methode,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: brut ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'drac-bot',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
}

async function shaDe(chemin) {
  const res = await api('GET', chemin);
  if (res.status === 404) { shas.delete(chemin); return null; }
  if (!res.ok) throw new Error(`GET ${chemin} : ${res.status}`);
  const j = await res.json();
  shas.set(chemin, j.sha);
  return j.sha;
}

async function envoyer(chemin, texte) {
  const h = empreinte(texte);
  if (derniers.get(chemin) === h) return; // rien n'a changé
  for (let essai = 0; essai < 2; essai++) {
    if (essai > 0 || !shas.has(chemin)) await shaDe(chemin);
    const res = await api('PUT', chemin, {
      message: `maj ${chemin}`,
      content: Buffer.from(texte).toString('base64'),
      branch: BRANCH,
      sha: shas.get(chemin),
    });
    if (res.ok) {
      const j = await res.json();
      shas.set(chemin, j.content.sha);
      derniers.set(chemin, h);
      return;
    }
    if (res.status !== 409 && res.status !== 422) throw new Error(`PUT ${chemin} : ${res.status}`);
  }
  throw new Error(`PUT ${chemin} : conflit`);
}

async function retirer(chemin) {
  derniers.delete(chemin);
  const sha = await shaDe(chemin);
  if (!sha) return; // déjà absent
  const res = await api('DELETE', chemin, { message: `suppression ${chemin}`, sha, branch: BRANCH });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE ${chemin} : ${res.status}`);
  shas.delete(chemin);
  console.log(`[github] ${chemin} supprimé`);
}

// Tout le dossier d'une session dans un seul texte JSON (seulement si le numéro est bien jumelé)
function empaqueter(dir) {
  try {
    const creds = JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8'));
    if (!creds.registered) return null;
    const out = {};
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isFile()) out[f] = fs.readFileSync(p, 'utf8');
    }
    return JSON.stringify(out);
  } catch {
    return null;
  }
}

function sauverSession(number, dir) {
  return enfiler(async () => {
    const contenu = empaqueter(dir);
    if (contenu) await envoyer(`sessions/${number}.json`, contenu);
  });
}

// Sauvegarde dans quelques secondes (regroupe les changements rapprochés)
export function planifier(number, dir, delai = 20000) {
  if (!actif) return;
  clearTimeout(minuteries.get(number));
  minuteries.set(number, setTimeout(() => {
    minuteries.delete(number);
    sauverSession(number, dir);
  }, delai));
}

// Efface la sauvegarde GitHub d'un numéro (et annule sa sauvegarde en attente)
export function supprimerSauvegarde(number) {
  if (!actif) return;
  clearTimeout(minuteries.get(number));
  minuteries.delete(number);
  return enfiler(() => retirer(`sessions/${number}.json`));
}

function sauverLangues(dossier) {
  return enfiler(async () => {
    const f = path.join(dossier, 'langues.json');
    if (fs.existsSync(f)) await envoyer('langues.json', fs.readFileSync(f, 'utf8'));
  });
}

// Sauvegarde du choix de langue dans quelques secondes
export function planifierLangues(dossier, delai = 3000) {
  if (!actif) return;
  clearTimeout(minuteries.get('langues'));
  minuteries.set('langues', setTimeout(() => {
    minuteries.delete('langues');
    sauverLangues(dossier);
  }, delai));
}

// Sauvegarde toutes les sessions jumelées + les langues choisies
export function toutSauvegarder(dossier) {
  if (!actif) return Promise.resolve();
  for (const n of fs.readdirSync(dossier)) {
    if (/^\d{8,15}$/.test(n)) sauverSession(n, path.join(dossier, n));
  }
  sauverLangues(dossier);
  return file;
}

// Au démarrage : remet en place les sessions absentes du disque local
export async function restaurer(dossier) {
  if (!actif) {
    console.log('[github] sauvegarde désactivée (GITHUB_TOKEN / GITHUB_REPO absents)');
    return;
  }
  const res = await api('GET', 'sessions');
  if (res.status === 404) {
    console.log('[github] aucune sauvegarde pour le moment');
  } else if (!res.ok) {
    throw new Error(`liste des sessions : ${res.status}`);
  } else {
    for (const f of await res.json()) {
      const m = /^(\d{8,15})\.json$/.exec(f.name);
      if (!m) continue;
      shas.set(f.path, f.sha);
      const dir = path.join(dossier, m[1]);
      if (fs.existsSync(path.join(dir, 'creds.json'))) continue; // déjà présente en local
      const r = await api('GET', f.path, null, true);
      if (!r.ok) { console.error(`[github] lecture ${f.path} : ${r.status}`); continue; }
      const texte = await r.text();
      fs.mkdirSync(dir, { recursive: true });
      for (const [nom, contenu] of Object.entries(JSON.parse(texte))) {
        fs.writeFileSync(path.join(dir, path.basename(nom)), contenu);
      }
      derniers.set(f.path, empreinte(texte));
      console.log(`[github] session ${m[1]} restaurée`);
    }
  }

  const fl = path.join(dossier, 'langues.json');
  if (!fs.existsSync(fl)) {
    const r = await api('GET', 'langues.json', null, true);
    if (r.ok) {
      const texte = await r.text();
      fs.writeFileSync(fl, texte);
      derniers.set('langues.json', empreinte(texte));
      console.log('[github] langues restaurées');
    }
  }
}
