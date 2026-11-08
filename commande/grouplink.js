import { estGroupe } from '../lib/groupe.js';

export default {
  name: 'grouplink',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    try {
      const code = await sock.groupInviteCode(jid);
      const meta = await sock.groupMetadata(jid);
      return `https://chat.whatsapp.com/${code}\n\n🔗 *${t.groupe.lien}* ${meta.subject}`;
    } catch (e) {
      console.error('[grouplink]', e.message);
      return t.groupe.echec;
    }
  },
};
