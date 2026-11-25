<script setup lang="ts">
import { ReceiptText, Trash2 } from 'lucide-vue-next'
import type { JajanExpense } from '~/types'
import { formatRupiah, formatTanggalPendek } from '~/utils/format'

defineProps<{
  title: string
  expenses: JajanExpense[]
  emptyText?: string
  showDate?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
</script>

<template>
  <section class="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <ReceiptText class="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
        <h2 class="text-base font-bold text-stone-900 dark:text-white">{{ title }}</h2>
      </div>
      <span class="rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        {{ expenses.length }} catatan
      </span>
    </div>

    <div
      v-if="expenses.length === 0"
      class="mt-4 rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400"
    >
      {{ emptyText || 'Belum ada pengeluaran tercatat.' }}
    </div>

    <ul v-else class="mt-3 divide-y divide-stone-100 dark:divide-stone-800/80">
      <li
        v-for="item in expenses"
        :key="item.id"
        class="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
            {{ item.label }}
          </p>
          <p class="mt-0.5 flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
            <span v-if="showDate">{{ formatTanggalPendek(item.date) }}</span>
            <span v-else>{{ formatTime(item.createdAt) }}</span>
            <span>·</span>
            <span class="truncate italic">"{{ item.rawInput }}"</span>
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2.5">
          <span class="text-sm font-bold tabular-nums text-stone-900 dark:text-white">
            {{ formatRupiah(item.amount) }}
          </span>
          <button
            type="button"
            class="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
            title="Hapus catatan"
            :aria-label="`Hapus ${item.label}`"
            @click="emit('remove', item.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
