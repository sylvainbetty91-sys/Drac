import { appliquerLangue } from './langue.js';

export default {
  name: 'es',
  async run(ctx) {
    return appliquerLangue(ctx, 'es');
  },
};
