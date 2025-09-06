// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  css: ['~/assets/css/main.css'],

  modules: ['@pinia/nuxt'],
  imports: {
    dirs: ['stores']
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
