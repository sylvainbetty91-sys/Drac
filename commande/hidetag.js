import { estGroupe, texteApres, jidDe } from '../lib/groupe.js';

export default {
  name: 'hidetag',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    const meta = await sock.groupMetadata(jid);
    return { text: texteApres(msg), mentions: meta.participants.map(jidDe) };
  },
};
