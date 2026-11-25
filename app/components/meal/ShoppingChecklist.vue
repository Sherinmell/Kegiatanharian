<script setup lang="ts">
import { Check, RotateCcw, ShoppingCart } from 'lucide-vue-next'
import type { MealSlot } from '~/types'

interface ShoppingItem {
  id: string
  name: string
  measure: string
  slots: MealSlot[]
  isPantryStaple: boolean
  checked: boolean
}

const props = defineProps<{
  items: ShoppingItem[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  resetChecked: []
}>()

const checkedCount = computed(() => props.items.filter(i => i.checked).length)

function slotLabel(slot: MealSlot): string {
  if (slot === 'sarapan') return 'Sarapan'
  if (slot === 'siang') return 'Siang'
  return 'Malam'
}
</script>

<template>
  <section class="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <ShoppingCart class="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-stone-900 dark:text-white">
            Daftar Belanja Praktis Hari Ini
          </h2>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ checkedCount }} dari {{ items.length }} bahan sudah dicentang
          </p>
        </div>
      </div>

      <button
        v-if="checkedCount > 0"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        @click="emit('resetChecked')"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Reset Centang
      </button>
    </div>

    <div v-if="items.length === 0" class="mt-4 rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
      Keren! Semua bahan untuk 3 menu hari ini sudah ada di kulkasmu.
    </div>

    <div v-else class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition"
        :class="
          item.checked
            ? 'border-emerald-200 bg-emerald-50/50 text-stone-400 line-through dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-stone-500'
            : 'border-stone-200 bg-stone-50/60 text-stone-800 hover:border-emerald-300 hover:bg-white dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-200 dark:hover:border-emerald-700'
        "
        @click="emit('toggle', item.id)"
      >
        <span
          class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition"
          :class="
            item.checked
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
          "
        >
          <Check v-if="item.checked" class="h-3 w-3" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold">{{ item.measure }}</p>
          <p class="text-[11px] text-stone-500 no-underline dark:text-stone-400">
            Untuk {{ item.slots.map(slotLabel).join(', ') }}
          </p>
        </div>
      </button>
    </div>
  </section>
</template>
