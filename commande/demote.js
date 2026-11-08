import { estGroupe, cible, majParticipant } from '../lib/groupe.js';

export default {
  name: 'demote',
  async run({ sock, msg, args, t }) {
    const jid = msg.key.remoteJid;
    if (!estGroupe(jid)) return t.groupe.seulementGroupe;
    const membre = cible(msg, args);
    if (!membre) return t.groupe.cibleManquante;
    const r = await majParticipant(sock, jid, membre, 'demote');
    return r.ok ? t.groupe.demote : `${t.groupe.echec} (${r.status})`;
  },
};
