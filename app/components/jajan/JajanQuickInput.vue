<script setup lang="ts">
import { CornerDownLeft, Sparkles, Zap } from 'lucide-vue-next'
import { QUICK_JAJAN_PRESETS, parseJajanInput } from '~/composables/useJajanParser'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  showPresets?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  submitted: [rawInput: string]
}>()

const text = ref('')
const errorMsg = ref('')

const livePreview = computed(() => {
  if (!text.value.trim()) return null
  return parseJajanInput(text.value)
})

function handleSubmit() {
  const raw = text.value.trim()
  if (!raw) return
  const parsed = parseJajanInput(raw)
  if (!parsed.valid) {
    errorMsg.value = parsed.error || 'Format belum dikenali.'
    return
  }
  errorMsg.value = ''
  emit('submitted', raw)
  text.value = ''
}

function applyPreset(preset: string) {
  emit('submitted', preset)
}
</script>

<template>
  <div class="space-y-3">
    <form class="relative" @submit.prevent="handleSubmit">
      <div
        class="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-xs transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-900"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
          <Zap class="h-5 w-5" />
        </div>

        <input
          v-model="text"
          type="text"
          autocomplete="off"
          placeholder='Ketik cepat: "25rb kopi", "15000 parkir", "12.5k gorengan"...'
          class="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none sm:text-base dark:text-white dark:placeholder-stone-500"
          @input="errorMsg = ''"
        >

        <button
          type="submit"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 sm:text-sm"
        >
          <span>Catat</span>
          <CornerDownLeft class="h-3.5 w-3.5" />
        </button>
      </div>
    </form>

    <!-- Live Smart Parser Preview -->
    <div v-if="livePreview" class="flex flex-wrap items-center gap-2 text-xs">
      <template v-if="livePreview.valid">
        <span class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Sparkles class="h-3.5 w-3.5" />
          Terdeteksi:
          <strong class="tabular-nums">{{ formatRupiah(livePreview.amount) }}</strong>
          <span>•</span>
          <span>{{ livePreview.label }}</span>
        </span>
        <span class="text-stone-400 dark:text-stone-500">Tekan Enter untuk simpan</span>
      </template>
      <span
        v-else
        class="rounded-xl bg-amber-50 px-3 py-1.5 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
      >
        {{ livePreview.error }}
      </span>
    </div>

    <p v-else-if="errorMsg" class="text-xs font-semibold text-rose-600 dark:text-rose-400">
      {{ errorMsg }}
    </p>

    <!-- 1-Click Quick Chips -->
    <div v-if="showPresets && !compact" class="flex flex-wrap items-center gap-1.5">
      <span class="mr-1 text-xs font-medium text-stone-500 dark:text-stone-400">1-Klik cepat:</span>
      <button
        v-for="preset in QUICK_JAJAN_PRESETS"
        :key="preset"
        type="button"
        class="rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
        @click="applyPreset(preset)"
      >
        + {{ preset }}
      </button>
    </div>
  </div>
</template>
