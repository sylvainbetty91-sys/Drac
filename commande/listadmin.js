import { estGroupe, jidDe } from '../lib/groupe.js';

export default {
  name: 'listadmin',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    const meta = await sock.groupMetadata(jid);
    const admins = meta.participants.filter((p) => p.admin);
    const liste = admins.map((p, i) => `${i + 1}. @${jidDe(p).split('@')[0]}`).join('\n');
    return { text: `${t.groupe.admins}\n${liste}`, mentions: admins.map(jidDe) };
  },
};
