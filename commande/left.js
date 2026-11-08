import config from '../configuration/config.js';
import { estGroupe } from '../lib/groupe.js';

export default {
  name: 'left',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    try {
      // Le message d'adieu part avant de quitter (après, il n'est plus possible d'écrire)
      await sock.sendMessage(jid, { text: t.groupe.auRevoir(config.bot.nom) }, { quoted: msg });
      await sock.groupLeave(jid);
    } catch (e) {
      console.error('[left]', e.message);
      return t.groupe.echec;
    }
    return null;
  },
};
