import pino from 'pino';
import * as baileysNs from '@whiskeysockets/baileys';

const lib = {
  ...baileysNs,
  ...(typeof baileysNs.default === 'object' ? baileysNs.default : {}),
};

export const estGroupe = (jid) => jid.endsWith('@g.us');

// Infos de contexte du message (citation, mentions)
function contexte(msg) {
  return msg.message?.extendedTextMessage?.contextInfo || {};
}

// Message cité : { id, auteur, message } ou null
export function cite(msg) {
  const c = contexte(msg);
  if (!c.quotedMessage) return null;
  return { id: c.stanzaId, auteur: c.participant, message: c.quotedMessage };
}

// Cible d'une commande : personne mentionnée, auteur du message cité, ou numéro tapé
export function cible(msg, args) {
  const c = contexte(msg);
  if (c.mentionedJid?.length) return c.mentionedJid[0];
  if (c.quotedMessage && c.participant) return c.participant;
  const num = args.join('').replace(/\D/g, '');
  return num.length >= 8 ? `${num}@s.whatsapp.net` : null;
}

// Texte tapé après la commande (garde les retours à la ligne)
export function texteApres(msg) {
  const brut = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  return brut.replace(/^\S+\s*/, '');
}

// Identifiant d'un participant utilisable pour une mention
export const jidDe = (p) => p.phoneNumber || p.id;

// Numéro du bot (= ton compte)
export const moi = (sock) => `${sock.user.id.split(':')[0].split('@')[0]}@s.whatsapp.net`;

// remove / promote / demote / add : renvoie { ok, status }
export async function majParticipant(sock, groupe, membre, action) {
  try {
    const res = await sock.groupParticipantsUpdate(groupe, [membre], action);
    const status = String(res?.[0]?.status ?? '200');
    return { ok: status === '200', status };
  } catch (e) {
    console.error(`[${action}]`, e.message);
    return { ok: false, status: e?.output?.statusCode ?? e.message };
  }
}

// Télécharge le média d'un message cité
export function telecharger(sock, jid, q) {
  const message = {
    key: { remoteJid: jid, id: q.id, participant: q.auteur, fromMe: false },
    message: q.message,
  };
  return lib.downloadMediaMessage(
    message,
    'buffer',
    {},
    { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
  );
}
