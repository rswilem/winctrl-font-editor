// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },
  css: ['~/assets/css/main.css'],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en' },

      bodyAttrs: { class: 'font-sans antialiased text-neutral-900 tracking-tight' },

      title: 'Font Editor for the WINCTRL X-Plane plugin',

      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
        { property: 'og:title', content: 'Font Editor for the WINCTRL X-Plane plugin' },
        {
          property: 'og:description',
          content:
            'Edit and create custom fonts for the WINCTRL X-Plane plugin with this easy-to-use web-based font editor.'
        }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon' as any, href: '/favicon.ico' }]
    }
  },

  modules: ['@pinia/nuxt'],
  imports: {
    dirs: ['stores']
  },
  runtimeConfig: {
    public: {
      pluginName: 'WINCTRL X-Plane plugin',
      pluginUrl: 'https://github.com/rswilem/winwing-xplane-plugin#winwing-plugin-for-x-plane'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
