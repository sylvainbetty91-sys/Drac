import { getLang, messageAccueil } from '../lib/langue.js';
import config from '../configuration/config.js';
import { fuseauDe } from '../lib/fuseau.js';

const { developpeur, bot, chaine, groupe } = config;

function uptime() {
  let s = Math.floor(process.uptime());
  const j = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return `${j}J ${h}H ${m}M ${s}S`;
}

// Vérifie que le contenu téléchargé est bien une image (JPEG, PNG, WEBP, GIF)
function estImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG';
  const gif = buf.toString('latin1', 0, 3) === 'GIF';
  const webp = buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP';
  return jpeg || png || gif || webp;
}

// Photo du bot : uniquement le lien donné dans configuration (bot.ppUrl).
// Si le lien échoue, la raison est écrite dans les logs.
async function photoDuBot() {
  if (!bot.ppUrl) {
    console.error('[menu] ppUrl est vide dans configuration/config.js');
    return null;
  }
  try {
    const res = await fetch(bot.ppUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`[menu] ppUrl : le lien répond ${res.status}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (estImage(buf)) return buf;
    console.error(`[menu] ppUrl : ce lien n'est pas une image directe (type reçu : ${res.headers.get('content-type') || 'inconnu'})`);
  } catch (e) {
    console.error('[menu] ppUrl : lien illisible :', e.message);
  }
  return null; // pas d'image : le menu s'affiche sans
}

// Écran de choix de la langue (même texte que le message de bienvenue)
const choixLangue = messageAccueil;

export default {
  name: 'menu',
  choixLangue,
  async run({ sock, msg, commands, prefix, number }) {
    const lang = getLang(number);
    if (!lang) return choixLangue(prefix); // première utilisation : on demande la langue

    const FUSEAU = fuseauDe(number); // heure locale de la personne (d'après son numéro)
    const now = new Date();
    const loc = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang];
    const date = now.toLocaleDateString(loc, { timeZone: FUSEAU });
    const heure = now.toLocaleTimeString(loc, { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' });
    const nom = bot.nom; // nom du bot (configuration)

    const liste = [...commands.values()]
      .filter((c) => !['fr', 'en', 'es'].includes(c.name))
      .map((c) => `┃  ◦ ${prefix}${c.name}`)
      .join('\n');

    const text =
`╭━━━┈┈┈┈┈┈┈┈━━━╮
┃       𝙸𝙽𝙵𝙾𝚂 𝙳𝚄 𝙱𝙾𝚃 ʕ˖͜͡˖ʔ
┃ ──────────────
┃  ◦ 𝙽𝙾𝙼      ⟶ ${nom}
┃  ◦ 𝙳𝙰𝚃𝙴      ⟶ ${date}
┃  ◦ 𝚄𝙿𝚃𝙸𝙼𝙴    ⟶ ${uptime()}
┃  ◦ 𝙷𝙴𝚄𝚁𝙴     ⟶ ${heure}
╰━━━┈┈┈┈┈┈┈┈━━━╯

╭━━━┈┈┈┈┈┈┈┈━━━╮
┃     𝙻𝙸𝚂𝚃𝙴 𝙳𝙴𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝙴𝚂 ʕ˖͜͡˖ʔ
┃ ──────────────
${liste}
╰━━━┈┈┈┈┈┈┈┈━━━╯
> ${developpeur.nom}`;

    const pp = await photoDuBot();

    const contextInfo = {};

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

    // Image du bot (config ou photo de profil) avec le menu en légende
    if (pp) return { image: pp, caption: text, contextInfo };
    return { text, contextInfo };
  },
};
