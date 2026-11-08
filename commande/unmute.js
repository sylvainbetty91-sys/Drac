import { estGroupe } from '../lib/groupe.js';

export default {
  name: 'unmute',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    try {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      return t.groupe.unmute;
    } catch (e) {
      console.error('[unmute]', e.message);
      return t.groupe.echec;
    }
  },
};
