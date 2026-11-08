import { cite } from '../lib/groupe.js';

export default {
  name: 'delete',
  async run({ sock, msg, t }) {
    const jid = msg.key.remoteJid;
    const q = cite(msg);
    if (!q) return t.groupe.repondreMessage;

    // Le message cité est-il de toi ? (sinon il faut être admin du groupe)
    const miens = [sock.user.id, sock.user.lid].filter(Boolean).map((x) => x.split(':')[0].split('@')[0]);
    const fromMe = miens.includes((q.auteur || '').split(':')[0].split('@')[0]);

    try {
      await sock.sendMessage(jid, {
        delete: { remoteJid: jid, fromMe, id: q.id, participant: q.auteur },
      });
    } catch (e) {
      console.error('[delete]', e.message);
      return t.groupe.echec;
    }
    return null;
  },
};
