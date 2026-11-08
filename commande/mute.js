import { estGroupe } from '../lib/groupe.js';

export default {
  name: 'mute',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    try {
      await sock.groupSettingUpdate(jid, 'announcement');
      return t.groupe.mute;
    } catch (e) {
      console.error('[mute]', e.message);
      return t.groupe.echec;
    }
  },
};
