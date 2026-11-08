import { estGroupe, texteApres, jidDe } from '../lib/groupe.js';

export default {
  name: 'tagall',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;

    const contexte = texteApres(msg) || t.groupe.sansContexte;
    const meta = await sock.groupMetadata(jid);

    let teks = `${t.groupe.tagall}\n> *${contexte}*\n\n`;
    for (const p of meta.participants) teks += `@${jidDe(p).split('@')[0]}\n`;

    return { text: teks, mentions: meta.participants.map(jidDe) };
  },
};
