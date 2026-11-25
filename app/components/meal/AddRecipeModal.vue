<script setup lang="ts">
import { ChefHat, Plus, X } from 'lucide-vue-next'
import type { BudgetTier, CookingTimeRange, MealSlot, Recipe, RecipeIngredient } from '~/types'

const emit = defineEmits<{
  submit: [payload: { recipe: Omit<Recipe, 'id' | 'isCustom'>; selectImmediately: boolean }]
  close: []
}>()

const name = ref('')
const slot = ref<MealSlot>('siang')
const cookingMinutes = ref<number>(20)
const budget = ref<Exclude<BudgetTier, 'all'>>('hemat')
const estimatedCost = ref<number>(18000)
const servings = ref('2–3 porsi')
const summary = ref('')
const ingredientsText = ref('')
const stepsText = ref('')
const tips = ref('')
const selectImmediately = ref(true)
const errorMsg = ref('')

function deriveCookingTime(minutes: number): Exclude<CookingTimeRange, 'all'> {
  if (minutes < 15) return 'under-15'
  if (minutes <= 30) return '15-30'
  return 'over-30'
}

function parseIngredientLine(line: string): RecipeIngredient {
  const measure = line.trim()
  // Hapus angka & satuan umum di awal untuk mendapatkan kata kunci bahan
  const cleaned = measure
    .toLowerCase()
    .replace(
      /^[\d.,/]+\s*(butir|buah|ikat|papan|siung|batang|potong|lembar|piring|bungkus|keping|ekor|bonggol|genggam|cup|sdm|sdt|gr|gram|kg|ml|liter|pack)?\s*/i,
      '',
    )
    .trim()

  const key = cleaned.split(/\s+/).slice(0, 2).join(' ') || measure.toLowerCase()
  const displayName = cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : measure

  return {
    name: displayName,
    key,
    measure,
  }
}

function handleSubmit() {
  if (!name.value.trim()) {
    errorMsg.value = 'Nama masakan wajib diisi.'
    return
  }

  const ingredientLines = ingredientsText.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  if (ingredientLines.length === 0) {
    errorMsg.value = 'Isi minimal 1 bahan yang dibutuhkan (1 bahan per baris).'
    return
  }

  const stepLines = stepsText.value
    .split('\n')
    .map(l => l.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)

  if (stepLines.length === 0) {
    errorMsg.value = 'Isi minimal 1 langkah cara memasak (1 langkah per baris).'
    return
  }

  errorMsg.value = ''

  const minutes = Math.max(5, Number(cookingMinutes.value) || 20)
  const cost = Math.max(0, Number(estimatedCost.value) || 15000)

  emit('submit', {
    recipe: {
      name: name.value.trim(),
      slot: slot.value,
      cookingTime: deriveCookingTime(minutes),
      cookingMinutes: minutes,
      budget: budget.value,
      estimatedCost: cost,
      servings: servings.value.trim() || '2 porsi',
      summary:
        summary.value.trim()
        || `Resep rumahan pilihan untuk ${slot.value === 'sarapan' ? 'sarapan' : slot.value === 'siang' ? 'makan siang' : 'makan malam'}.`,
      tips: tips.value.trim() || 'Sesuaikan takaran garam, gula, dan penyedap sesuai selera keluarga.',
      tags: ['resep saya', 'rumahan'],
      ingredients: ingredientLines.map(parseIngredientLine),
      steps: stepLines,
    },
    selectImmediately: selectImmediately.value,
  })
}
</script>

<template>
  <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/60 dark:bg-stone-900">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <ChefHat class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h3 class="text-base font-bold text-stone-900 dark:text-white">
          Tambah Rekomendasi Menu / Resep Sendiri
        </h3>
      </div>
      <button
        type="button"
        class="rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        aria-label="Tutup form resep"
        @click="emit('close')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="recipe-name" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Nama Masakan
          </label>
          <input
            id="recipe-name"
            v-model="name"
            type="text"
            placeholder="Misal: Tumis Buncis Tahu Telur"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:bg-stone-900"
          >
        </div>

        <div>
          <label for="recipe-slot" class="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Cocok Untuk
          </label>
          <select
            id="recipe-slot"
            v-model="slot"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:bg-stone-900"
          >
            <option value="sarapan">Sarapan</option>
            <option value="siang">Makan Siang</option>
            <option value="malam">Makan Malam</option>
          </select>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <div>
          <label for="recipe-minutes" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Waktu Masak (mnt)
          </label>
          <input
            id="recipe-minutes"
            v-model.number="cookingMinutes"
            type="number"
            min="5"
            max="180"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          >
        </div>

        <div>
          <label for="recipe-budget" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Kategori Bujet
          </label>
          <select
            id="recipe-budget"
            v-model="budget"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          >
            <option value="hemat">Hemat / Anak Kos</option>
            <option value="standar">Standar Keluarga</option>
            <option value="spesial">Spesial</option>
          </select>
        </div>

        <div>
          <label for="recipe-cost" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Estimasi Biaya (Rp)
          </label>
          <input
            id="recipe-cost"
            v-model.number="estimatedCost"
            type="number"
            min="0"
            step="1000"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          >
        </div>

        <div>
          <label for="recipe-servings" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Porsi
          </label>
          <input
            id="recipe-servings"
            v-model="servings"
            type="text"
            placeholder="2–3 porsi"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          >
        </div>
      </div>

      <div>
        <label for="recipe-summary" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
          Deskripsi Singkat (Opsional)
        </label>
        <input
          id="recipe-summary"
          v-model="summary"
          type="text"
          placeholder="Misal: Tumisan praktis gurih pedas cocok dengan nasi hangat."
          class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
        >
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="recipe-ingredients" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Bahan yang Dibutuhkan (1 bahan per baris)
          </label>
          <textarea
            id="recipe-ingredients"
            v-model="ingredientsText"
            rows="5"
            placeholder="2 butir telur&#10;4 potong tahu putih&#10;1 ikat sawi hijau&#10;3 siung bawang putih"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
        </div>

        <div>
          <label for="recipe-steps" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Cara Memasak (1 langkah per baris)
          </label>
          <textarea
            id="recipe-steps"
            v-model="stepsText"
            rows="5"
            placeholder="Potong dadu tahu lalu goreng setengah matang.&#10;Tumis bawang putih hingga harum, masukkan telur dan orak-arik.&#10;Masukkan tahu, sawi, saus tiram, dan sedikit air lalu masak 3 menit."
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label for="recipe-tips" class="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
          Tips Masak (Opsional)
        </label>
        <input
          id="recipe-tips"
          v-model="tips"
          type="text"
          placeholder="Misal: Pakai api besar saat menumis sayur agar tetap hijau renyah."
          class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
        >
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
        <input
          v-model="selectImmediately"
          type="checkbox"
          class="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
        >
        Langsung jadikan menu terpilih hari ini
      </label>

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
          Simpan Resep
        </button>
      </div>
    </form>
  </div>
</template>
