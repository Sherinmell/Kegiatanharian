<script setup lang="ts">
import {
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShoppingBasket,
  Sparkles,
  Timer,
  Users,
  Wallet,
  X,
} from 'lucide-vue-next'
import type { GeneratedMealEntry, MealSlot, Recipe } from '~/types'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  entry: GeneratedMealEntry
  activeSlot: MealSlot | null
  isItemChecked: (key: string) => boolean
  getItemKey: (recipeId: string, ingredientKey: string) => string
}>()

const emit = defineEmits<{
  close: []
  assignSlot: [payload: { recipe: Recipe; slot: MealSlot }]
  toggleItem: [key: string]
}>()

const slotChoices: { key: MealSlot; label: string; time: string }[] = [
  { key: 'sarapan', label: 'Sarapan', time: 'Pagi' },
  { key: 'siang', label: 'Makan Siang', time: 'Siang' },
  { key: 'malam', label: 'Makan Malam', time: 'Malam' },
]

const doneSteps = ref<Record<number, boolean>>({})

// Built-in Cooking Timer
const initialSeconds = computed(() => Math.max(60, props.entry.recipe.cookingMinutes * 60))
const secondsLeft = ref(initialSeconds.value)
const timerRunning = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function toggleTimer() {
  if (timerRunning.value) {
    stopTimer()
    return
  }
  if (secondsLeft.value <= 0) {
    secondsLeft.value = initialSeconds.value
  }
  timerRunning.value = true
  timerInterval = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value -= 1
    } else {
      stopTimer()
    }
  }, 1000)
}

function resetTimer() {
  stopTimer()
  secondsLeft.value = initialSeconds.value
}

const formattedTimer = computed(() => {
  const mins = Math.floor(secondsLeft.value / 60)
  const secs = secondsLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

watch(
  () => props.entry.recipe.id,
  () => {
    doneSteps.value = {}
    resetTimer()
  },
)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('keydown', handleKeydown)
})

function toggleStep(idx: number) {
  doneSteps.value = {
    ...doneSteps.value,
    [idx]: !doneSteps.value[idx],
  }
}

const completedStepCount = computed(() =>
  props.entry.recipe.steps.filter((_, idx) => doneSteps.value[idx]).length,
)

const stepProgressPercent = computed(() => {
  const total = props.entry.recipe.steps.length
  if (total === 0) return 0
  return Math.round((completedStepCount.value / total) * 100)
})

const allStepsDone = computed(() =>
  props.entry.recipe.steps.length > 0 && completedStepCount.value === props.entry.recipe.steps.length,
)

const missingPantryStaples = computed(() =>
  props.entry.missingIngredients.filter(i => i.isPantryStaple),
)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/65 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`Mode Masak: ${entry.recipe.name}`"
      @click.self="emit('close')"
    >
      <div class="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:rounded-3xl dark:border-stone-800 dark:bg-stone-900">
        <!-- Sticky Modal Header -->
        <div class="flex items-start justify-between gap-3 border-b border-stone-200/80 bg-white px-5 py-4 dark:border-stone-800 dark:bg-stone-900">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                <ChefHat class="h-3.5 w-3.5" />
                Mode Masak Fokus
              </span>
              <span
                v-if="entry.isExactMatch"
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white"
              >
                <CheckCircle2 class="h-3 w-3" />
                Tanpa Bahan Lain
              </span>
            </div>
            <h2 class="mt-1.5 text-lg leading-snug font-extrabold text-stone-900 sm:text-xl dark:text-white">
              {{ entry.recipe.name }}
            </h2>
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-stone-500 dark:text-stone-400">
              <span class="inline-flex items-center gap-1">
                <Clock class="h-3.5 w-3.5" />
                {{ entry.recipe.cookingMinutes }} menit
              </span>
              <span v-if="entry.recipe.servings" class="inline-flex items-center gap-1">
                <Users class="h-3.5 w-3.5" />
                {{ entry.recipe.servings }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Wallet class="h-3.5 w-3.5" />
                ~{{ formatRupiah(entry.recipe.estimatedCost) }}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="rounded-xl border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            aria-label="Tutup Mode Masak"
            @click="emit('close')"
          >
            <X class="h-4.5 w-4.5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <!-- Flexible Slot Picker -->
          <div class="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-3.5 dark:border-stone-800 dark:bg-stone-800/50">
            <p class="text-xs font-bold text-stone-700 dark:text-stone-200">
              Pasang Menu Ini Untuk Waktu Makan:
            </p>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <button
                v-for="slot in slotChoices"
                :key="slot.key"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95"
                :class="
                  activeSlot === slot.key
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-700'
                "
                @click="emit('assignSlot', { recipe: entry.recipe, slot: slot.key })"
              >
                <Check v-if="activeSlot === slot.key" class="h-3.5 w-3.5" />
                <span>{{ slot.label }}</span>
              </button>
            </div>
          </div>

          <!-- Built-in Kitchen Timer -->
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <Timer class="h-5 w-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Timer Masak
                </p>
                <p class="text-xl font-extrabold tabular-nums text-stone-900 dark:text-white">
                  {{ formattedTimer }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition active:scale-95"
                :class="timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'"
                @click="toggleTimer"
              >
                <Pause v-if="timerRunning" class="h-3.5 w-3.5" />
                <Play v-else class="h-3.5 w-3.5" />
                {{ timerRunning ? 'Jeda' : 'Mulai' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                @click="resetTimer"
              >
                <RotateCcw class="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          <!-- Ingredients Summary -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold tracking-wide text-stone-500 uppercase dark:text-stone-400">
              Bahan yang Dibutuhkan ({{ entry.recipe.ingredients.length }})
            </h3>

            <div v-if="entry.matchedIngredients.length > 0" class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles class="h-3.5 w-3.5" />
                Sudah Ada di Kulkas
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="ing in entry.matchedIngredients"
                  :key="ing.key"
                  class="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <Check class="h-3.5 w-3.5" />
                  {{ ing.measure }}
                </span>
              </div>
            </div>

            <div v-if="entry.isExactMatch" class="space-y-2">
              <div class="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Semua bahan utama sudah tersedia — bisa langsung dimasak!
              </div>
              <div v-if="missingPantryStaples.length > 0" class="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <span class="font-semibold">Bumbu dasar dapur:</span>
                <span
                  v-for="ing in missingPantryStaples"
                  :key="ing.key"
                  class="rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                >
                  {{ ing.measure }}
                </span>
              </div>
            </div>

            <div v-else-if="entry.missingIngredients.length > 0" class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <ShoppingBasket class="h-3.5 w-3.5" />
                Perlu Belanja / Siapkan ({{ entry.missingIngredients.length }})
              </p>
              <div class="grid gap-1.5 sm:grid-cols-2">
                <button
                  v-for="ing in entry.missingIngredients"
                  :key="ing.key"
                  type="button"
                  class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition"
                  :class="
                    isItemChecked(getItemKey(entry.recipe.id, ing.key))
                      ? 'border-emerald-200 bg-emerald-50/60 text-stone-400 line-through dark:border-emerald-900/60 dark:bg-emerald-950/30'
                      : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-amber-300 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-200'
                  "
                  @click="emit('toggleItem', getItemKey(entry.recipe.id, ing.key))"
                >
                  <span
                    class="flex h-4 w-4 shrink-0 items-center justify-center rounded-md border"
                    :class="
                      isItemChecked(getItemKey(entry.recipe.id, ing.key))
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
                    "
                  >
                    <Check v-if="isItemChecked(getItemKey(entry.recipe.id, ing.key))" class="h-3 w-3" />
                  </span>
                  <span class="flex-1 font-medium">{{ ing.measure }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Step-by-Step Cooking Instructions -->
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-xs font-bold tracking-wide text-stone-500 uppercase dark:text-stone-400">
                Langkah Memasak
              </h3>
              <span class="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {{ completedStepCount }}/{{ entry.recipe.steps.length }} selesai ({{ stepProgressPercent }}%)
              </span>
            </div>

            <div class="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                :style="{ width: `${stepProgressPercent}%` }"
              />
            </div>

            <ol class="space-y-2.5">
              <li v-for="(step, idx) in entry.recipe.steps" :key="idx">
                <button
                  type="button"
                  class="flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left text-sm leading-relaxed transition"
                  :class="
                    doneSteps[idx]
                      ? 'border-emerald-200 bg-emerald-50/50 text-stone-400 line-through dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-stone-500'
                      : 'border-stone-200 bg-white text-stone-800 hover:border-emerald-300 dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-100'
                  "
                  @click="toggleStep(idx)"
                >
                  <span
                    class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition"
                    :class="
                      doneSteps[idx]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200'
                    "
                  >
                    <Check v-if="doneSteps[idx]" class="h-3.5 w-3.5" />
                    <span v-else>{{ idx + 1 }}</span>
                  </span>
                  <span class="flex-1">{{ step }}</span>
                </button>
              </li>
            </ol>

            <div
              v-if="allStepsDone"
              class="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Masakan selesai! Selamat menikmati {{ entry.recipe.name }}.
            </div>

            <!-- Cooking Tips -->
            <div
              v-if="entry.recipe.tips"
              class="flex items-start gap-2.5 rounded-2xl bg-amber-50/80 p-3.5 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/35 dark:text-amber-200"
            >
              <Lightbulb class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Tips Dapur:</strong> {{ entry.recipe.tips }}</span>
            </div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="flex items-center justify-end gap-2 border-t border-stone-200/80 bg-stone-50/80 px-5 py-3.5 dark:border-stone-800 dark:bg-stone-950/60">
          <button
            type="button"
            class="rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            @click="emit('close')"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
