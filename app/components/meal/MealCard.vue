<script setup lang="ts">
import {
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  PlusCircle,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-vue-next'
import type { GeneratedMealEntry, MealSlot } from '~/types'
import { formatRupiah } from '~/utils/format'

const props = withDefaults(
  defineProps<{
    entry: GeneratedMealEntry
    isItemChecked: (key: string) => boolean
    getItemKey: (recipeId: string, ingredientKey: string) => string
    mode?: 'daily' | 'alternative'
    selectedSlot?: MealSlot | null
    highlighted?: boolean
  }>(),
  {
    mode: 'daily',
    selectedSlot: null,
    highlighted: false,
  },
)

const emit = defineEmits<{
  shuffle: [slot: MealSlot]
  select: [entry: GeneratedMealEntry]
  openCooking: [entry: GeneratedMealEntry]
  deleteCustom: [recipeId: string]
  toggleItem: [key: string]
}>()

const showSteps = ref(false)
const doneSteps = ref<Record<number, boolean>>({})

watch(
  () => props.entry.recipe.id,
  () => {
    doneSteps.value = {}
  },
)

function toggleStepDone(idx: number) {
  doneSteps.value = {
    ...doneSteps.value,
    [idx]: !doneSteps.value[idx],
  }
}

const slotMeta = computed(() => {
  switch (props.entry.slot) {
    case 'sarapan':
      return {
        label: 'Sarapan',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        borderAccent: 'border-t-amber-400',
      }
    case 'siang':
      return {
        label: 'Makan Siang',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        borderAccent: 'border-t-emerald-500',
      }
    case 'malam':
      return {
        label: 'Makan Malam',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        borderAccent: 'border-t-indigo-500',
      }
  }
})

const budgetLabel = computed(() => {
  switch (props.entry.recipe.budget) {
    case 'hemat':
      return 'Hemat / Anak Kos'
    case 'standar':
      return 'Standar Keluarga'
    case 'spesial':
      return 'Spesial'
  }
})

const isSelected = computed(() => Boolean(props.selectedSlot))

const selectedSlotLabel = computed(() => {
  if (props.selectedSlot === 'sarapan') return 'Sarapan'
  if (props.selectedSlot === 'siang') return 'Siang'
  if (props.selectedSlot === 'malam') return 'Malam'
  return ''
})

const totalIngredientsCount = computed(() => props.entry.recipe.ingredients.length)

const missingPantryStaples = computed(() =>
  props.entry.missingIngredients.filter(ing => ing.isPantryStaple),
)
</script>

<template>
  <article
    class="flex flex-col rounded-2xl border border-t-4 bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-stone-900"
    :class="[
      slotMeta.borderAccent,
      highlighted
        ? 'border-emerald-500 ring-2 ring-emerald-500/40'
        : isSelected && mode === 'alternative'
          ? 'border-emerald-400 ring-1 ring-emerald-400/40 dark:border-emerald-700'
          : 'border-stone-200/90 dark:border-stone-800',
    ]"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 space-y-1.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="rounded-lg px-2.5 py-0.5 text-xs font-bold" :class="slotMeta.badgeClass">
            {{ slotMeta.label }}
          </span>
          <span
            v-if="entry.isExactMatch"
            class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white"
          >
            <CheckCircle2 class="h-3 w-3" />
            Tanpa Bahan Lain
          </span>
          <span
            v-else-if="entry.matchedIngredients.length > 0"
            class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
          >
            <Sparkles class="h-3 w-3" />
            Cocok {{ entry.matchedIngredients.length }}/{{ totalIngredientsCount }} bahan
          </span>
          <span
            v-if="entry.recipe.isCustom"
            class="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/70 dark:text-sky-300"
          >
            Resep Saya
          </span>
        </div>

        <h3 class="text-lg leading-snug font-bold text-stone-900 dark:text-white">
          {{ entry.recipe.name }}
        </h3>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-stone-500 dark:text-stone-400">
          <span class="inline-flex items-center gap-1">
            <Clock class="h-3.5 w-3.5" />
            {{ entry.recipe.cookingMinutes }} mnt
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

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          v-if="mode === 'daily'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
          title="Ganti rekomendasi menu ini"
          @click="emit('shuffle', entry.slot)"
        >
          <RefreshCw class="h-3.5 w-3.5" />
          Acak
        </button>

        <button
          v-else-if="isSelected"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
          title="Klik untuk buka Mode Masak atau ganti waktu makan"
          @click="emit('openCooking', entry)"
        >
          <CheckCircle2 class="h-3.5 w-3.5" />
          Terpilih ({{ selectedSlotLabel }})
        </button>

        <button
          v-else
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
          title="Pasang sebagai menu hari ini & buka panduan memasak"
          @click="emit('select', entry)"
        >
          <PlusCircle class="h-3.5 w-3.5" />
          Pilih Menu
        </button>

        <button
          v-if="entry.recipe.isCustom"
          type="button"
          class="rounded-xl p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          title="Hapus resep kustom"
          @click="emit('deleteCustom', entry.recipe.id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p class="mt-2.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
      {{ entry.recipe.summary }}
    </p>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <span class="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        {{ budgetLabel }}
      </span>
      <span
        v-for="tag in entry.recipe.tags"
        :key="tag"
        class="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- Bahan yang Dibutuhkan -->
    <div class="mt-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs font-bold tracking-wide text-stone-700 uppercase dark:text-stone-300">
          Bahan yang Dibutuhkan ({{ totalIngredientsCount }})
        </p>
      </div>

      <!-- Matched Ingredients -->
      <div v-if="entry.matchedIngredients.length > 0">
        <p class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Sparkles class="h-3.5 w-3.5" />
          Sudah Ada di Kulkas ({{ entry.matchedIngredients.length }})
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="ing in entry.matchedIngredients"
            :key="ing.key"
            class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <Check class="h-3 w-3" />
            {{ ing.measure }}
          </span>
        </div>
      </div>

      <!-- Missing Ingredients (Checkable Practical Shopping List) -->
      <div v-if="entry.isExactMatch" class="space-y-2">
        <div class="flex items-center gap-1.5 rounded-xl bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Bisa langsung dimasak tanpa tambahan bahan lain!</span>
        </div>
        <div v-if="missingPantryStaples.length > 0" class="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <span class="font-semibold">Bumbu dasar dapur:</span>
          <span
            v-for="ing in missingPantryStaples"
            :key="ing.key"
            class="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
          >
            {{ ing.measure }}
          </span>
        </div>
      </div>

      <div v-else>
        <p class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <ShoppingBasket class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span v-if="entry.missingIngredients.length > 0">
            Perlu Belanja ({{ entry.missingIngredients.length }} bahan)
          </span>
          <span v-else class="text-emerald-700 dark:text-emerald-400">
            Semua bahan sudah tersedia di kulkas!
          </span>
        </p>

        <ul v-if="entry.missingIngredients.length > 0" class="space-y-1.5">
          <li v-for="ing in entry.missingIngredients" :key="ing.key">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition"
              :class="
                isItemChecked(getItemKey(entry.recipe.id, ing.key))
                  ? 'border-emerald-200 bg-emerald-50/60 text-stone-400 line-through dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-stone-500'
                  : 'border-stone-200/80 bg-stone-50/70 text-stone-800 hover:border-amber-300 hover:bg-amber-50/50 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-200 dark:hover:border-amber-700/60'
              "
              @click="emit('toggleItem', getItemKey(entry.recipe.id, ing.key))"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition"
                :class="
                  isItemChecked(getItemKey(entry.recipe.id, ing.key))
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
                "
              >
                <Check v-if="isItemChecked(getItemKey(entry.recipe.id, ing.key))" class="h-3 w-3" />
              </span>
              <span class="flex-1 font-medium">{{ ing.measure }}</span>
              <span
                v-if="ing.isPantryStaple"
                class="rounded-md bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 no-underline dark:bg-stone-700 dark:text-stone-300"
              >
                bumbu dasar
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Expandable Cara Memasak & Mode Masak Fokus -->
    <div class="mt-4 border-t border-stone-100 pt-3.5 dark:border-stone-800">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-xs font-bold text-stone-800 transition hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 dark:border-stone-700 dark:bg-stone-800/70 dark:text-stone-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          :aria-expanded="showSteps"
          @click="showSteps = !showSteps"
        >
          <span class="inline-flex items-center gap-2">
            <ChefHat class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Cara Memasak ({{ entry.recipe.steps.length }})
          </span>
          <ChevronUp v-if="showSteps" class="h-4 w-4" />
          <ChevronDown v-else class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          title="Buka tampilan Mode Masak fokus dengan timer & pilihan slot waktu"
          @click="emit('openCooking', entry)"
        >
          Mode Masak
        </button>
      </div>

      <div v-if="showSteps" class="mt-3 space-y-2.5">
        <ol class="space-y-2">
          <li v-for="(step, idx) in entry.recipe.steps" :key="idx">
            <button
              type="button"
              class="flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs leading-relaxed transition"
              :class="
                doneSteps[idx]
                  ? 'border-emerald-200 bg-emerald-50/50 text-stone-400 line-through dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-stone-500'
                  : 'border-stone-200/70 bg-white text-stone-700 hover:border-emerald-300 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-200'
              "
              @click="toggleStepDone(idx)"
            >
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition"
                :class="
                  doneSteps[idx]
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200'
                "
              >
                <Check v-if="doneSteps[idx]" class="h-3 w-3" />
                <span v-else>{{ idx + 1 }}</span>
              </span>
              <span class="flex-1">{{ step }}</span>
            </button>
          </li>
        </ol>

        <!-- Practical Tip -->
        <div
          v-if="entry.recipe.tips"
          class="flex items-start gap-2 rounded-xl bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900 dark:bg-amber-950/35 dark:text-amber-200"
        >
          <Lightbulb class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span><strong>Tips:</strong> {{ entry.recipe.tips }}</span>
        </div>
      </div>
    </div>
  </article>
</template>
