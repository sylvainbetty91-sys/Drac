const LETTRES = {
  a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
  h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
  o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
  v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
  0: '⓿', 1: '➊', 2: '➋', 3: '➌', 4: '➍',
  5: '➎', 6: '➏', 7: '➐', 8: '➑', 9: '➒',
};

export default {
  name: 'react-ch',
  async run({ sock, args, prefix, t }) {
    if (!args[0]) return t.groupe.reactUsage(prefix);
    if (!args[0].startsWith('https://whatsapp.com/channel/')) return t.groupe.reactLienInvalide;

    const emoji = args.slice(1).join(' ').split('').map((c) => {
      if (c === ' ') return '―';
      return LETTRES[c.toLowerCase()] || c;
    }).join('');

    try {
      const [, , , , channelId, messageId] = args[0].split('/');
      const res = await sock.newsletterMetadata('invite', channelId);
      await sock.newsletterReactMessage(res.id, messageId, emoji);
      return t.groupe.reactOk(emoji, res.name);
    } catch (e) {
      console.error('[react-ch]', e.message);
      return t.groupe.reactEchec;
    }
  },
};
