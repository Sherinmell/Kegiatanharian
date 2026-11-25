import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  runtimeConfig: {
    tidbHost: process.env.TIDB_HOST || '',
    tidbPort: Number(process.env.TIDB_PORT || 4000),
    tidbUser: process.env.TIDB_USER || '',
    tidbPassword: process.env.TIDB_PASSWORD || '',
    tidbDatabase: process.env.TIDB_DATABASE || 'harianku',
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  nitro: {
    externals: {
      inline: ['vue-router', 'pinia', '@vue/devtools-api'],
    },
  },
  app: {
    head: {
      title: 'HarianKu — Asisten Gaya Hidup & Rumah Tangga',
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'HarianKu menggabungkan generator menu makan harian, pengingat tugas rumah tangga berkala, dan pelacak jajan 1-klik dalam satu dashboard mobile-first.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})
