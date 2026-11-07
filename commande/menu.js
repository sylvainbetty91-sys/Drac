import { getLang, textes, messageAccueil } from '../lib/langue.js';

// ====== À PERSONNALISER ======
const NOM_BOT = 'MON BOT';
const FUSEAU = 'Europe/Paris';
// Chaîne WhatsApp : JID du type 120363XXXXXXXXXXXXXXXX@newsletter
const CHAINE_JID = '120363000000000000@newsletter';
const CHAINE_NOM = 'Ma chaîne';
const CHAINE_LIEN = 'https://whatsapp.com/channel/XXXXXXXXXXXX';
// =============================

function uptime() {
  let s = Math.floor(process.uptime());
  const j = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return `${j}J ${h}H ${m}M ${s}S`;
}

async function photoDeProfil(sock) {
  try {
    const moi = sock.user.id.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    const url = await sock.profilePictureUrl(moi, 'image');
    const res = await fetch(url);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// Écran de choix de la langue (même texte que le message de bienvenue)
const choixLangue = messageAccueil;

export default {
  name: 'menu',
  choixLangue,
  async run({ sock, msg, commands, prefix, number }) {
    const lang = getLang(number);
    if (!lang) return choixLangue(prefix); // première utilisation : on demande la langue

    const t = textes(lang);
    const m = t.menu;
    const now = new Date();
    const loc = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang];
    const date = now.toLocaleDateString(loc, { timeZone: FUSEAU });
    const heure = now.toLocaleTimeString(loc, { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' });
    const nom = msg.pushName || '-';

    const liste = [...commands.values()]
      .filter((c) => !['fr', 'en', 'es'].includes(c.name))
      .map((c) => `│ ➜ ${prefix}${c.name} : ${t.commandes[c.name] ?? ''}`)
      .join('\n');

    const text =
`┌──〔 ${m.utilisateur} 〕
│ 👤 ${m.nom} ➜ ${nom}
│ 📅 ${m.date} ➜ ${date}
│ ⏰ ${m.heure} ➜ ${heure}
└────────────

┌──〔 ${m.bot} 〕
│ 🟢 ${m.statut} ➜ ${m.enLigne}
│ ⏳ ${m.uptime} ➜ ${uptime()}
└────────────

┌──〔 ${m.commandes} 〕
${liste}
└────────────

🌐 ${m.changerLangue} : ${prefix}langue`;

    const pp = await photoDeProfil(sock);

    return {
      text,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 1,
        forwardedNewsletterMessageInfo: {
          newsletterJid: CHAINE_JID,
          newsletterName: CHAINE_NOM,
          serverMessageId: 100,
        },
        externalAdReply: {
          title: NOM_BOT,
          body: heure,
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: false,
          sourceUrl: CHAINE_LIEN,
          ...(pp ? { thumbnail: pp } : {}),
        },
      },
    };
  },
};
