import { cite, moi, telecharger } from '../lib/groupe.js';

export default {
  name: 'setpp',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    const q = cite(msg);
    if (!q?.message?.imageMessage) return t.groupe.repondreImage;
    try {
      const image = await telecharger(sock, jid, q);
      await sock.updateProfilePicture(moi(sock), image);
      return t.groupe.ppChangee;
    } catch (e) {
      console.error('[setpp]', e.message);
      return t.groupe.echec;
    }
  },
};
