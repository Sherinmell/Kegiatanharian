<script setup lang="ts">
import { Home, UtensilsCrossed, CheckSquare, Wallet, Sparkles, Database } from 'lucide-vue-next'
import { useChoresTracker } from '~/composables/useChoresTracker'
import { useCloudSync } from '~/composables/useCloudSync'
import { useJajanParser } from '~/composables/useJajanParser'

const route = useRoute()
const { summaryStats } = useChoresTracker()
const { status: cloudStatus } = useCloudSync()
const { isOverDailyLimit } = useJajanParser()

const navItems = computed(() => [
  {
    to: '/',
    label: 'Ringkasan',
    shortLabel: 'Beranda',
    icon: Home,
    badge: 0,
    alertDot: false,
  },
  {
    to: '/menu',
    label: 'Masak Apa?',
    shortLabel: 'Menu',
    icon: UtensilsCrossed,
    badge: 0,
    alertDot: false,
  },
  {
    to: '/tugas',
    label: 'Tugas Rumah',
    shortLabel: 'Tugas',
    icon: CheckSquare,
    badge: summaryStats.value.urgent,
    alertDot: false,
  },
  {
    to: '/jajan',
    label: 'Jajan Tracker',
    shortLabel: 'Jajan',
    icon: Wallet,
    badge: 0,
    alertDot: isOverDailyLimit.value,
  },
])

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
    <!-- Top Header & Desktop Navigation -->
    <header class="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-lg dark:border-stone-800/80 dark:bg-stone-950/85">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <!-- Brand -->
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
            <Sparkles class="h-5 w-5" />
          </div>
          <div>
            <span class="block text-base font-extrabold tracking-tight text-stone-900 dark:text-white">
              HarianKu
            </span>
            <span class="hidden text-[11px] font-medium text-stone-500 sm:block dark:text-stone-400">
              Asisten Rumah Tangga & Gaya Hidup
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Tabs -->
        <nav class="hidden items-center gap-1 rounded-2xl bg-stone-100/90 p-1 md:flex dark:bg-stone-900">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition"
            :class="
              isActive(item.to)
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-stone-800 dark:text-emerald-400'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
            "
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.badge > 0"
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white"
            >
              {{ item.badge }}
            </span>
            <span
              v-else-if="item.alertDot"
              class="h-2 w-2 rounded-full bg-rose-500"
              title="Pengeluaran hari ini melebihi jatah"
            />
          </NuxtLink>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <ClientOnly>
            <div
              class="hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
              :class="
                cloudStatus === 'connected'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : cloudStatus === 'syncing'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400'
              "
              :title="
                cloudStatus === 'connected'
                  ? 'Tersinkronisasi dengan TiDB Cloud'
                  : cloudStatus === 'syncing'
                    ? 'Menyambungkan ke TiDB Cloud...'
                    : 'Mode lokal (offline cache)'
              "
            >
              <Database class="h-3.5 w-3.5" />
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="
                  cloudStatus === 'connected'
                    ? 'bg-emerald-500'
                    : cloudStatus === 'syncing'
                      ? 'animate-pulse bg-amber-500'
                      : 'bg-stone-400'
                "
              />
              <span>{{ cloudStatus === 'connected' ? 'TiDB Cloud' : cloudStatus === 'syncing' ? 'Sync...' : 'Lokal' }}</span>
            </div>
          </ClientOnly>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Page Content -->
    <main class="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6 md:pb-12">
      <slot />
    </main>

    <!-- Mobile Bottom Navigation Bar -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden dark:border-stone-800 dark:bg-stone-950/95"
      aria-label="Navigasi utama"
    >
      <div class="mx-auto grid max-w-md grid-cols-4 gap-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition"
          :class="
            isActive(item.to)
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
          "
        >
          <div class="relative">
            <component :is="item.icon" class="h-5 w-5" />
            <span
              v-if="item.badge > 0"
              class="absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
            >
              {{ item.badge }}
            </span>
            <span
              v-else-if="item.alertDot"
              class="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-950"
            />
          </div>
          <span>{{ item.shortLabel }}</span>
        </NuxtLink>
      </div>
    </nav>

    <AppToast />
  </div>
</template>
