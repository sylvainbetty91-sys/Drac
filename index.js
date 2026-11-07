import express from 'express';
import pino from 'pino';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as baileysNs from '@whiskeysockets/baileys';

// Compatible avec les différentes façons dont Baileys exporte ses fonctions
const lib = {
  ...baileysNs,
  ...(typeof baileysNs.default === 'object' ? baileysNs.default : {}),
};
const makeWASocket = typeof baileysNs.default === 'function' ? baileysNs.default : lib.default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = lib;

globalThis.crypto ??= webcrypto;

const PORT = process.env.PORT || 3000;
const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions';
const ACCESS_KEY = process.env.ACCESS_KEY || ''; // optionnel : protège la page
const PREFIX = '!';
const PAIR_TIMEOUT_MS = 4 * 60 * 1000;

const logger = pino({ level: 'silent' });
const sessions = new Map(); // numéro -> { sock, opened }

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

/* ---------- Commandes du bot (dossier commande/) ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDES_DIR = path.join(__dirname, 'commande');
const commands = new Map();

for (const file of fs.readdirSync(COMMANDES_DIR)) {
  if (!file.endsWith('.js')) continue;
  const mod = await import(pathToFileURL(path.join(COMMANDES_DIR, file)).href);
  const cmd = mod.default;
  commands.set(cmd.name, cmd);
}
console.log(`Commandes chargées : ${[...commands.keys()].join(', ')}`);

async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
  if (!msg.key.fromMe) return; // bot perso : seul le propriétaire du numéro peut l'utiliser

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    '';
  if (!text.startsWith(PREFIX)) return;

  const name = text.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
  const cmd = commands.get(name);
  if (!cmd) return;

  const reply = await cmd.run({ sock, msg, commands, prefix: PREFIX });
  await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
}

/* ---------- Gestion des sessions ---------- */
function destroySession(number) {
  const s = sessions.get(number);
  if (s) {
    try { s.sock.end(undefined); } catch {}
    sessions.delete(number);
  }
  fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true });
}

// onCode(err, code) n'est passé que pour un nouveau jumelage
async function startSession(number, { onCode = null, trusted = false } = {}) {
  const dir = path.join(SESSIONS_DIR, number);
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (e) {
    console.error('Version WhatsApp non récupérée, valeur par défaut utilisée :', e.message);
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
  });

  const entry = { sock, opened: trusted };
  sessions.set(number, entry);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try { await handleMessage(sock, msg); } catch (e) { console.error(number, e.message); }
    }
  });

  let pairTimer = null;
  const wantsCode = Boolean(onCode) && !state.creds.registered;
  let codeRequested = false;

  async function requestCode() {
    try {
      const pairing = await sock.requestPairingCode(number);
      console.log(`[${number}] code de jumelage généré`);
      onCode(null, pairing);
      pairTimer = setTimeout(() => {
        if (!entry.opened) destroySession(number);
      }, PAIR_TIMEOUT_MS);
    } catch (e) {
      console.error(`[${number}] échec requestPairingCode :`, e.message);
      destroySession(number);
      onCode(e);
    }
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    // Le code est demandé quand la connexion à WhatsApp est prête (événement qr)
    if (qr && wantsCode && !codeRequested) {
      codeRequested = true;
      requestCode();
    }
    if (connection) {
      console.log(
        `[${number}] connexion : ${connection}`,
        lastDisconnect?.error?.output?.statusCode ?? ''
      );
    }

    if (connection === 'open') {
      entry.opened = true;
      if (pairTimer) clearTimeout(pairTimer);
      console.log(`[${number}] connecté`);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (sessions.get(number) !== entry) return; // session déjà remplacée ou supprimée

      if (code === DisconnectReason.loggedOut) {
        console.log(`[${number}] déconnecté depuis WhatsApp, session supprimée`);
        destroySession(number);
      } else if (code === DisconnectReason.restartRequired || entry.opened) {
        // redémarrage normal après jumelage, ou coupure réseau
        setTimeout(() => startSession(number, { trusted: true }).catch(console.error), 2000);
      } else {
        destroySession(number); // jumelage jamais terminé
      }
    }
  });
}

/* ---------- Serveur web ---------- */
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (_req, res) => res.send('ok'));

app.get('/api/config', (_req, res) => res.json({ keyRequired: Boolean(ACCESS_KEY) }));

app.post('/api/pair', async (req, res) => {
  const { number: raw = '', key = '' } = req.body || {};
  if (ACCESS_KEY && key !== ACCESS_KEY) {
    return res.status(401).json({ error: "Clé d'accès incorrecte." });
  }

  const number = String(raw).replace(/\D/g, '');
  if (number.length < 8 || number.length > 15) {
    return res.status(400).json({
      error: 'Numéro invalide. Saisis-le avec l’indicatif, sans + ni espaces (ex. 33612345678).',
    });
  }

  if (number.startsWith('0')) {
    return res.status(400).json({
      error: 'Ajoute l’indicatif du pays au début, sans le 0 (ex. 33612345678 au lieu de 0612345678).',
    });
  }

  const existing = sessions.get(number);
  if (existing?.opened) {
    return res.status(409).json({ error: 'Ce numéro est déjà connecté au bot.' });
  }
  if (existing) destroySession(number);

  let answered = false;
  const answer = (status, body) => {
    if (answered) return;
    answered = true;
    res.status(status).json(body);
  };

  try {
    await startSession(number, {
      onCode: (err, code) => {
        if (err) return answer(500, { error: 'Impossible d’obtenir le code. Réessaie dans un instant.' });
        answer(200, { code });
      },
    });
  } catch (e) {
    console.error('Erreur startSession :', e);
    answer(500, { error: `Erreur au démarrage de la session : ${e.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur prêt sur le port ${PORT}`);
  // Rétablit les sessions déjà jumelées après un redémarrage
  for (const number of fs.readdirSync(SESSIONS_DIR)) {
    if (/^\d{8,15}$/.test(number)) {
      startSession(number, { trusted: true }).catch(console.error);
    }
  }
});
