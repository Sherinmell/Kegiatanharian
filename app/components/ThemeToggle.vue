<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Moon, Sun } from 'lucide-vue-next'

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storageKey: 'harianku:theme',
})

const toggleDark = useToggle(isDark)
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
      :title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
      :aria-label="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
      @click="toggleDark()"
    >
      <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
      <Moon v-else class="h-4 w-4 text-stone-600" />
    </button>
    <template #fallback>
      <div class="h-10 w-10 rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" />
    </template>
  </ClientOnly>
</template>
