import { getLang, textes, messageAccueil } from '../lib/langue.js';
import config from '../configuration/config.js';

const { developpeur, bot, chaine, groupe } = config;
const FUSEAU = 'Europe/Paris';
const SIGNATURE = `> ${developpeur.nom}`;

// Met un texte en police « machine à écrire » (𝙱𝙾𝚃 𝙸𝙽𝙵𝙾)
function mono(str) {
  return [...str.toUpperCase()]
    .map((c) => {
      if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1d670 + c.charCodeAt(0) - 65);
      if (c >= '0' && c <= '9') return String.fromCodePoint(0x1d7f6 + c.charCodeAt(0) - 48);
      return c;
    })
    .join('');
}

function uptime() {
  let s = Math.floor(process.uptime());
  const j = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return `${j}J ${h}H ${m}M ${s}S`;
}

// Image du bot : le lien de la configuration, sinon la photo de profil WhatsApp
async function photoDuBot(sock) {
  try {
    let url = bot.ppUrl;
    if (!url) {
      const moi = sock.user.id.split(':')[0].split('@')[0] + '@s.whatsapp.net';
      url = await sock.profilePictureUrl(moi, 'image');
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null; // pas d'image : le menu s'affiche sans
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
      .map((c) => `┃  ◦ ${prefix}${c.name}`)
      .join('\n');

    const text =
`╭━━━┈┈┈┈┈┈┈┈━━━╮
┃       ${mono(m.infoBot)} ʕ˖͜͡˖ʔ
┃ ──────────────
┃  ◦ ${mono(m.nom)}      ⟶ ${nom}
┃  ◦ ${mono(m.date)}      ⟶ ${date}
┃  ◦ ${mono(m.uptime)}    ⟶ ${uptime()}
╰━━━┈┈┈┈┈┈┈┈━━━╯

╭━━━┈┈┈┈┈┈┈┈━━━╮
┃     ${mono(m.commandes)} ʕ˖͜͡˖ʔ
┃ ──────────────
${liste}
╰━━━┈┈┈┈┈┈┈┈━━━╯
${SIGNATURE}`;

    const pp = await photoDuBot(sock);

    const contextInfo = {
      // Grande carte avec l'image du bot en haut
      externalAdReply: {
        title: bot.nom,
        body: heure,
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: false,
        sourceUrl: chaine.lien || groupe.lien || undefined,
        ...(pp ? { thumbnail: pp } : {}),
      },
    };

    // Bouton de chaîne WhatsApp (seulement si la chaîne est configurée)
    if (chaine.jid) {
      contextInfo.isForwarded = true;
      contextInfo.forwardingScore = 1;
      contextInfo.forwardedNewsletterMessageInfo = {
        newsletterJid: chaine.jid,
        newsletterName: chaine.nom,
        serverMessageId: 100,
      };
    }

    return { text, contextInfo };
  },
};
