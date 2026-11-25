<script setup lang="ts">
import { Plus, Refrigerator, X } from 'lucide-vue-next'

const props = defineProps<{
  ingredients: string[]
  suggestions: string[]
}>()

const emit = defineEmits<{
  add: [value: string]
  remove: [value: string]
  clear: []
}>()

const inputText = ref('')

function handleAdd() {
  const parts = inputText.value
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)

  for (const part of parts) {
    emit('add', part)
  }
  inputText.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    handleAdd()
  } else if (e.key === 'Backspace' && !inputText.value && props.ingredients.length > 0) {
    const last = props.ingredients[props.ingredients.length - 1]
    if (last) emit('remove', last)
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label for="fridge-input" class="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
        <Refrigerator class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        Bahan Sisa di Kulkas
      </label>
      <button
        v-if="ingredients.length > 0"
        type="button"
        class="text-xs font-medium text-stone-500 transition hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400"
        @click="emit('clear')"
      >
        Kosongkan ({{ ingredients.length }})
      </button>
    </div>

    <!-- Tag Input Container -->
    <div
      class="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-900/80 dark:focus-within:border-emerald-500 dark:focus-within:bg-stone-900"
    >
      <span
        v-for="item in ingredients"
        :key="item"
        class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
      >
        <span class="capitalize">{{ item }}</span>
        <button
          type="button"
          class="rounded-full p-0.5 transition hover:bg-emerald-200/80 dark:hover:bg-emerald-800"
          :aria-label="`Hapus ${item}`"
          @click="emit('remove', item)"
        >
          <X class="h-3 w-3" />
        </button>
      </span>

      <div class="flex min-w-40 flex-1 items-center gap-1.5">
        <input
          id="fridge-input"
          v-model="inputText"
          type="text"
          placeholder="Ketik bahan (telur, ayam, tahu) lalu Enter..."
          class="w-full bg-transparent px-1.5 py-1 text-sm text-stone-900 placeholder-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder-stone-500"
          @keydown="handleKeydown"
        >
        <button
          v-if="inputText.trim()"
          type="button"
          class="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
          @click="handleAdd"
        >
          <Plus class="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>
    </div>

    <!-- Quick Suggestions -->
    <div v-if="suggestions.length > 0" class="flex flex-wrap items-center gap-1.5">
      <span class="mr-1 text-xs font-medium text-stone-500 dark:text-stone-400">Pilih cepat:</span>
      <button
        v-for="item in suggestions.slice(0, 12)"
        :key="item"
        type="button"
        class="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 capitalize transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
        @click="emit('add', item)"
      >
        <Plus class="h-3 w-3 opacity-60" />
        {{ item }}
      </button>
    </div>
  </div>
</template>
