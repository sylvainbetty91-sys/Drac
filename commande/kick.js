import { estGroupe, cible, majParticipant } from '../lib/groupe.js';

export default {
  name: 'kick',
  async run({ sock, msg, args, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    const membre = cible(msg, args);
    if (!membre) return t.groupe.cibleManquante;
    const r = await majParticipant(sock, jid, membre, 'remove');
    return r.ok ? t.groupe.kick : `${t.groupe.echec} (${r.status})`;
  },
};
