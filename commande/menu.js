export default {
  name: 'menu',
  description: 'Afficher la liste des commandes',
  async run({ commands, prefix }) {
    const lignes = [...commands.values()].map(
      (c) => `${prefix}${c.name} : ${c.description}`
    );
    return `Commandes :\n${lignes.join('\n')}`;
  },
};
