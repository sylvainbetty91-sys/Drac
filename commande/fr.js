import { appliquerLangue } from './langue.js';

export default {
  name: 'fr',
  async run(ctx) {
    return appliquerLangue(ctx, 'fr');
  },
};
