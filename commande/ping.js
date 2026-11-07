export default {
  name: 'ping',
  async run({ sock, msg, t, recu }) {
    const jid = msg.key.remoteJid;

    // 1er message : pong
    await sock.sendMessage(jid, { text: t.pong }, { quoted: msg });

    // Le bot calcule lui-même son temps de réponse (en ms) depuis la réception de ta commande
    const ms = Math.round(performance.now() - recu);

    // 2e message : en ligne + vitesse
    await sock.sendMessage(jid, { text: `${t.enLigne}\n⚡ ${t.vitesse} ${ms} ms` });

    return null; // déjà envoyé
  },
};
