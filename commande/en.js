import { appliquerLangue } from './langue.js';

export default {
  name: 'en',
  async run(ctx) {
    return appliquerLangue(ctx, 'en');
  },
};
