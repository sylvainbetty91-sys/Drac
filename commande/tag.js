import { estGroupe, cite, jidDe } from '../lib/groupe.js';

export default {
  name: 'tag',
  async run({ sock, msg, prefix, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    const q = cite(msg);
    if (!q) return t.groupe.tagRepondre(`${prefix}tag`);

    const meta = await sock.groupMetadata(jid);
    try {
      await sock.sendMessage(jid, {
        forward: {
          key: { remoteJid: jid, id: q.id, participant: q.auteur, fromMe: false },
          message: q.message,
        },
        mentions: meta.participants.map(jidDe),
      });
    } catch (e) {
      console.error('[tag]', e.message);
      return t.groupe.echec;
    }
    return null;
  },
};
