import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Glide API Browser Extension',
    description: 'A browser extension for interacting with Glide tables',
    permissions: [
      'storage'
    ],
    host_permissions: [
      'https://api.glideapp.io/*'
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    }
  },
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env': '{}',
      'process.versions': '{}'
    }
  })
});
