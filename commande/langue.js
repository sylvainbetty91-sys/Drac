import menu from './menu.js';
import { LANGUES, setLang, textes } from '../lib/langue.js';

// Enregistre la langue puis affiche le menu dans cette langue
export async function appliquerLangue(ctx, choix) {
  setLang(ctx.number, choix);
  const reponse = await menu.run(ctx);
  reponse.text = `${textes(choix).langueChangee}\n\n${reponse.text}`;
  return reponse;
}

export default {
  name: 'langue',
  async run(ctx) {
    const choix = (ctx.args[0] || '').toLowerCase();
    if (!LANGUES[choix]) return menu.choixLangue(ctx.prefix); // affiche les 3 choix
    return appliquerLangue(ctx, choix);
  },
};
