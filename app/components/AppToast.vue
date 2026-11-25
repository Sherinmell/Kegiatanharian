<script setup lang="ts">
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-vue-next'
import { useAppToast } from '~/composables/useAppToast'

const { toasts, dismissToast } = useAppToast()
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 bottom-22 z-50 flex max-w-sm flex-col gap-2 md:top-20 md:bottom-auto"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md"
        :class="{
          'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-100': toast.tone === 'success',
          'border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-800 dark:bg-amber-950/95 dark:text-amber-100': toast.tone === 'warning',
          'border-stone-200 bg-white/95 text-stone-800 dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-100': toast.tone === 'info',
        }"
      >
        <CheckCircle2 v-if="toast.tone === 'success'" class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <AlertTriangle v-else-if="toast.tone === 'warning'" class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <Info v-else class="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
        <span class="flex-1">{{ toast.text }}</span>
        <button
          type="button"
          class="rounded-lg p-1 opacity-60 transition hover:opacity-100"
          aria-label="Tutup notifikasi"
          @click="dismissToast(toast.id)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
