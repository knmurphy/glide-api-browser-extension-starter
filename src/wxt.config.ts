import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Glide API Browser Extension',
    description: 'A browser extension for interacting with Glide tables',
    permissions: [
      'storage'
    ]
  },
  modules: ['@wxt-dev/module-vue'],
});
