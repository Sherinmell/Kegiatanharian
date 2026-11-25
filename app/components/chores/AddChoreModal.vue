<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { CHORE_CATEGORIES, INTERVAL_PRESETS } from '~/composables/useChoresTracker'
import type { ChoreCategory } from '~/types'

const emit = defineEmits<{
  submit: [payload: { title: string; category: ChoreCategory; intervalDays: number; notes?: string }]
  close: []
}>()

const title = ref('')
const category = ref<ChoreCategory>('rumah')
const intervalDays = ref<number>(7)
const notes = ref('')
const errorMsg = ref('')

function handleSubmit() {
  if (!title.value.trim()) {
    errorMsg.value = 'Nama tugas wajib diisi.'
    return
  }
  if (!intervalDays.value || intervalDays.value < 1) {
    errorMsg.value = 'Interval minimal 1 hari.'
    return
  }
  errorMsg.value = ''
  emit('submit', {
    title: title.value.trim(),
    category: category.value,
    intervalDays: Number(intervalDays.value),
    notes: notes.value.trim() || undefined,
  })
  title.value = ''
  notes.value = ''
  intervalDays.value = 7
}
</script>

<template>
  <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/60 dark:bg-stone-900">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-base font-bold text-stone-900 dark:text-white">
        Tambah Tugas Berkala Baru
      </h3>
      <button
        type="button"
        class="rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        aria-label="Tutup form"
        @click="emit('close')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="chore-title" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Nama Tugas
          </label>
          <input
            id="chore-title"
            v-model="title"
            type="text"
            placeholder="Misal: Ganti spons cuci piring"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:bg-stone-900"
          >
        </div>

        <div>
          <label for="chore-category" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Kategori
          </label>
          <select
            id="chore-category"
            v-model="category"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:bg-stone-900"
          >
            <option v-for="cat in CHORE_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label for="chore-interval" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
          Interval Pengulangan (Hari)
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in INTERVAL_PRESETS"
            :key="preset.days"
            type="button"
            class="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
            :class="
              intervalDays === preset.days
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200'
            "
            @click="intervalDays = preset.days"
          >
            Tiap {{ preset.label }}
          </button>

          <div class="flex items-center gap-1.5">
            <input
              id="chore-interval"
              v-model.number="intervalDays"
              type="number"
              min="1"
              max="365"
              class="w-20 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
            >
            <span class="text-xs font-medium text-stone-500 dark:text-stone-400">hari</span>
          </div>
        </div>
      </div>

      <div>
        <label for="chore-notes" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
          Catatan Singkat (Opsional)
        </label>
        <input
          id="chore-notes"
          v-model="notes"
          type="text"
          placeholder="Misal: Pakai air hangat dan sabun cuci piring"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
        >
      </div>

      <p v-if="errorMsg" class="text-xs font-semibold text-rose-600 dark:text-rose-400">
        {{ errorMsg }}
      </p>

      <div class="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="submit"
          class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus class="h-4 w-4" />
          Simpan Tugas
        </button>
      </div>
    </form>
  </div>
</template>
