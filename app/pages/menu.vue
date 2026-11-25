<script setup lang="ts">
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Shuffle,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from 'lucide-vue-next'
import { useAppToast } from '~/composables/useAppToast'
import { useJajanParser } from '~/composables/useJajanParser'
import { BUDGET_OPTIONS, TIME_OPTIONS, useMealGenerator } from '~/composables/useMealGenerator'
import type { GeneratedMealEntry, MealSlot, Recipe } from '~/types'
import { formatRupiah } from '~/utils/format'

useHead({
  title: 'Masak Apa Hari Ini? — HarianKu',
})

const { showToast } = useAppToast()
const {
  store: jajanStore,
  remainingMonthlyBudget,
  remainingDaysInMonth,
  dailyAllowanceStart,
  remainingTodayAllowance,
} = useJajanParser()

const {
  store,
  dailyMeals,
  exactMatchRecipes,
  otherRecommendations,
  totalEstimatedCost,
  budgetMealPackages,
  shuffleBudgetCombo,
  applyBudgetMealPlan,
  aggregatedShoppingList,
  totalRecipeCount,
  suggestedIngredients,
  generateSmartMeals,
  shuffleSlot,
  shuffleAllMeals,
  selectRecipeForSlot,
  getSelectedSlotForRecipe,
  getShoppingItemKey,
} = useMealGenerator()

const showAddRecipe = ref(false)
const altSlotFilter = ref<'all' | MealSlot>('all')
const onlyMatchedAlt = ref(false)
const visibleExactLimit = ref(6)
const visibleAltLimit = ref(6)
const hasMounted = ref(false)
const highlightedSlot = ref<MealSlot | null>(null)
const dailySectionRef = ref<HTMLElement | null>(null)
const cookingModalEntry = ref<GeneratedMealEntry | null>(null)

const cookingModalActiveSlot = computed<MealSlot | null>(() => {
  if (!cookingModalEntry.value) return null
  return getSelectedSlotForRecipe(cookingModalEntry.value.recipe.id)
})

function openCookingModal(entry: GeneratedMealEntry) {
  cookingModalEntry.value = entry
}

function handleAssignSlotFromModal(payload: { recipe: Recipe; slot: MealSlot }) {
  selectRecipeForSlot(payload.recipe, payload.slot)
  highlightedSlot.value = payload.slot
  setTimeout(() => {
    if (highlightedSlot.value === payload.slot) highlightedSlot.value = null
  }, 2200)
  const slotText = payload.slot === 'sarapan' ? 'Sarapan' : payload.slot === 'siang' ? 'Makan Siang' : 'Makan Malam'
  showToast(`"${payload.recipe.name}" dipasang untuk ${slotText} Hari Ini!`, 'success')
}

onMounted(() => {
  nextTick(() => {
    hasMounted.value = true
  })
})

// Otomatis sesuaikan rekomendasi saat pengguna mengubah bahan kulkas, waktu masak, bujet, atau mode tanpa belanja
watch(
  [
    () => store.fridgeIngredients.join('|'),
    () => store.cookingTime,
    () => store.budget,
    () => store.onlyExactFridgeMode,
  ],
  () => {
    if (!hasMounted.value) return
    generateSmartMeals()
  },
)

const visibleExactMatchRecipes = computed(() =>
  exactMatchRecipes.value.slice(0, visibleExactLimit.value),
)

const remainingExactCount = computed(() =>
  Math.max(0, exactMatchRecipes.value.length - visibleExactMatchRecipes.value.length),
)

const filteredOtherRecommendations = computed(() => {
  return otherRecommendations.value.filter((entry) => {
    if (altSlotFilter.value !== 'all' && entry.slot !== altSlotFilter.value) {
      return false
    }
    if (onlyMatchedAlt.value && store.fridgeIngredients.length > 0 && entry.matchedIngredients.length === 0) {
      return false
    }
    return true
  })
})

const visibleOtherRecommendations = computed(() =>
  filteredOtherRecommendations.value.slice(0, visibleAltLimit.value),
)

const remainingOtherCount = computed(() =>
  Math.max(0, filteredOtherRecommendations.value.length - visibleOtherRecommendations.value.length),
)

const matchedAltCount = computed(() =>
  otherRecommendations.value.filter(entry => entry.matchedIngredients.length > 0).length,
)

function handleGenerateSmart() {
  generateSmartMeals()
  showToast('Rekomendasi menu disesuaikan dengan bahan kulkas & preferensimu!', 'success')
}

function handleShuffleAll() {
  shuffleAllMeals()
  showToast('Kombinasi menu baru siap dicoba!', 'info')
}

function handleShuffleSlot(slot: MealSlot) {
  shuffleSlot(slot)
}

function handleSelectAlternative(entry: GeneratedMealEntry) {
  selectRecipeForSlot(entry.recipe, entry.recipe.slot)
  highlightedSlot.value = entry.recipe.slot
  setTimeout(() => {
    if (highlightedSlot.value === entry.recipe.slot) highlightedSlot.value = null
  }, 2200)
  cookingModalEntry.value = entry
  const slotText = entry.recipe.slot === 'sarapan' ? 'Sarapan' : entry.recipe.slot === 'siang' ? 'Makan Siang' : 'Makan Malam'
  showToast(`"${entry.recipe.name}" dipilih untuk ${slotText} — Mode Masak dibuka!`, 'success')
}

function handleAddCustomRecipe(payload: { recipe: Omit<Recipe, 'id' | 'isCustom'>; selectImmediately: boolean }) {
  const created = store.addCustomRecipe(payload.recipe)
  if (payload.selectImmediately) {
    selectRecipeForSlot(created)
  }
  showAddRecipe.value = false
  showToast(`Resep "${created.name}" berhasil ditambahkan!`, 'success')
}

function handleDeleteCustomRecipe(recipeId: string) {
  store.deleteCustomRecipe(recipeId)
  showToast('Resep kustom dihapus.', 'info')
}

function handleApplyBudgetPackage(meals: [GeneratedMealEntry, GeneratedMealEntry, GeneratedMealEntry]) {
  if (applyBudgetMealPlan(meals)) {
    showToast('Paket 3x makan (Sarapan, Siang, Malam) berhasil dipasang ke Menu Utama Hari Ini!', 'success')
    dailySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function handleUpdateMonthlyBudget(amount: number) {
  jajanStore.setMonthlyBudget(amount)
  showToast(`Uang bulanan diperbarui ke ${formatRupiah(amount)} — rekomendasi otomatis disesuaikan!`, 'success')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div class="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
          <UtensilsCrossed class="h-3.5 w-3.5" />
          Generator Menu Makan Harian
        </div>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
          Hari Ini Masak/Makan Apa?
        </h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Masukkan bahan sisa di kulkas — temukan menu yang bisa langsung dimasak <strong>tanpa tambahan bahan lain</strong> maupun ide masakan harian lengkap dengan cara memasaknya.
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2.5">
        <div class="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-right dark:border-stone-800 dark:bg-stone-900">
          <p class="text-[11px] font-medium text-stone-500 dark:text-stone-400">Estimasi 3x Makan</p>
          <p class="text-lg font-extrabold text-emerald-700 tabular-nums dark:text-emerald-400">
            ~{{ formatRupiah(totalEstimatedCost) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Interactive Preferences Card -->
    <section class="space-y-5 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
      <MealFridgeTagInput
        :ingredients="store.fridgeIngredients"
        :suggestions="suggestedIngredients"
        @add="store.addIngredient"
        @remove="store.removeIngredient"
        @clear="store.clearIngredients"
      />

      <!-- Toggle Mode Tanpa Belanja -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/70 dark:bg-emerald-950/35">
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p class="text-xs font-bold text-emerald-900 sm:text-sm dark:text-emerald-200">
              Mode Tanpa Tambahan Bahan Lain
            </p>
            <p class="text-xs text-emerald-700/90 dark:text-emerald-300/80">
              Prioritaskan menu utama hari ini yang 100% hanya memakai bahan di kulkasmu (+ bumbu dasar dapur).
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          :aria-checked="store.onlyExactFridgeMode"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
          :class="store.onlyExactFridgeMode ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'"
          @click="store.onlyExactFridgeMode = !store.onlyExactFridgeMode"
        >
          <span
            class="inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition-transform"
            :class="store.onlyExactFridgeMode ? 'translate-x-5.5' : 'translate-x-1'"
          />
        </button>
      </div>

      <div class="grid gap-5 border-t border-stone-100 pt-5 md:grid-cols-2 dark:border-stone-800">
        <!-- Cooking Time Filter -->
        <div>
          <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Clock class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Batas Waktu Masak
          </p>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="opt in TIME_OPTIONS"
              :key="opt.value"
              type="button"
              class="rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95"
              :class="
                store.cookingTime === opt.value
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200'
              "
              @click="store.cookingTime = opt.value"
            >
              {{ opt.short }}
            </button>
          </div>
        </div>

        <!-- Budget Preference -->
        <div>
          <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Wallet class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Preferensi Bujet
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in BUDGET_OPTIONS"
              :key="opt.value"
              type="button"
              class="rounded-xl border px-3 py-2 text-left transition active:scale-95"
              :class="
                store.budget === opt.value
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200'
              "
              @click="store.budget = opt.value"
            >
              <span class="block text-xs font-bold">{{ opt.label }}</span>
              <span
                class="block text-[10px]"
                :class="store.budget === opt.value ? 'text-emerald-100' : 'text-stone-500 dark:text-stone-400'"
              >
                {{ opt.desc }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
        <p class="text-xs text-stone-500 dark:text-stone-400">
          Database lokal: <strong>{{ totalRecipeCount }} resep Indonesia</strong> lengkap dengan bahan &amp; cara memasak.
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
            @click="showAddRecipe = !showAddRecipe"
          >
            <Plus class="h-4 w-4" />
            Tambah Resep Sendiri
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
            @click="handleShuffleAll"
          >
            <Shuffle class="h-4 w-4" />
            Acak Semua
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
            @click="handleGenerateSmart"
          >
            <Sparkles class="h-4 w-4" />
            Cocokkan Terbaik
          </button>
        </div>
      </div>
    </section>

    <!-- Custom Recipe Form -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <MealAddRecipeModal
        v-if="showAddRecipe"
        @submit="handleAddCustomRecipe"
        @close="showAddRecipe = false"
      />
    </Transition>

    <!-- Monthly Budget Meal Planner -->
    <MealBudgetMealPlanner
      :monthly-budget="jajanStore.monthlyBudget"
      :remaining-monthly-budget="remainingMonthlyBudget"
      :remaining-days-in-month="remainingDaysInMonth"
      :daily-allowance-start="dailyAllowanceStart"
      :remaining-today-allowance="remainingTodayAllowance"
      :current-plan-cost="totalEstimatedCost"
      :packages="budgetMealPackages"
      @apply-package="handleApplyBudgetPackage"
      @shuffle-package="shuffleBudgetCombo"
      @open-cooking="openCookingModal"
      @update-monthly-budget="handleUpdateMonthlyBudget"
    />

    <!-- Dedicated Section: 100% Ready to Cook Without Extra Ingredients -->
    <section
      v-if="store.fridgeIngredients.length > 0"
      class="space-y-4 rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/70 to-white p-5 shadow-xs dark:border-emerald-900/70 dark:from-emerald-950/35 dark:to-stone-900"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            <CheckCircle2 class="h-3.5 w-3.5" />
            Langsung Masak · 0 Belanja Tambahan
          </div>
          <h2 class="mt-1.5 text-lg font-extrabold text-stone-900 dark:text-white">
            Makanan Sesuai Bahan Kulkasmu (Tanpa Bahan Lain)
          </h2>
          <p class="text-xs text-stone-600 dark:text-stone-300">
            <span v-if="exactMatchRecipes.length > 0">
              Ada <strong>{{ exactMatchRecipes.length }} masakan</strong> yang bisa langsung kamu buat sekarang hanya dari bahan:
              <strong class="capitalize">{{ store.fridgeIngredients.join(', ') }}</strong> (+ bumbu dasar dapur).
            </span>
            <span v-else>
              Belum ada resep 100% tanpa bahan tambahan untuk kombinasi bahan saat ini. Coba tambah 1 bahan populer (misal: telur, tahu, tempe, atau sawi) atau tambahkan resep versimu sendiri!
            </span>
          </p>
        </div>
      </div>

      <div v-if="visibleExactMatchRecipes.length > 0" class="grid gap-5 lg:grid-cols-3">
        <MealCard
          v-for="entry in visibleExactMatchRecipes"
          :key="`exact-${entry.recipe.id}`"
          :entry="entry"
          mode="alternative"
          :selected-slot="getSelectedSlotForRecipe(entry.recipe.id)"
          :is-item-checked="store.isShoppingItemChecked"
          :get-item-key="getShoppingItemKey"
          @select="handleSelectAlternative"
          @open-cooking="openCookingModal"
          @delete-custom="handleDeleteCustomRecipe"
          @toggle-item="store.toggleShoppingItem"
        />
      </div>

      <div v-if="remainingExactCount > 0" class="flex justify-center pt-1">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-2 text-xs font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-50 active:scale-95 dark:border-emerald-800 dark:bg-stone-900 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
          @click="visibleExactLimit += 6"
        >
          <ChevronDown class="h-4 w-4" />
          Lihat {{ remainingExactCount }} Menu Tanpa Belanja Lainnya
        </button>
      </div>
    </section>

    <!-- 3 Main Daily Menu Recommendations -->
    <section ref="dailySectionRef" class="scroll-mt-20 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-lg font-extrabold text-stone-900 dark:text-white">
            Rekomendasi Menu Utama Hari Ini
          </h2>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            Klik <strong>Cara Memasak</strong> di setiap kartu untuk melihat langkah memasak &amp; tips praktis.
          </p>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <MealCard
          v-for="entry in dailyMeals"
          :key="entry.slot"
          :entry="entry"
          mode="daily"
          :highlighted="highlightedSlot === entry.slot"
          :is-item-checked="store.isShoppingItemChecked"
          :get-item-key="getShoppingItemKey"
          @shuffle="handleShuffleSlot"
          @open-cooking="openCookingModal"
          @delete-custom="handleDeleteCustomRecipe"
          @toggle-item="store.toggleShoppingItem"
        />
      </div>
    </section>

    <!-- Aggregated Practical Shopping Checklist -->
    <MealShoppingChecklist
      :items="aggregatedShoppingList"
      @toggle="store.toggleShoppingItem"
      @reset-checked="store.clearCheckedShopping"
    />

    <!-- Other Matching Recipe Recommendations -->
    <section class="space-y-4 border-t border-stone-200/80 pt-6 dark:border-stone-800">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 class="text-lg font-extrabold text-stone-900 dark:text-white">
            Rekomendasi Menu Lainnya Sesuai Bahanmu
          </h2>
          <p class="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            <span v-if="store.fridgeIngredients.length > 0">
              Ditemukan <strong>{{ matchedAltCount }} menu alternatif</strong> yang cocok dengan bahan kulkasmu. Klik <strong>Pilih Menu</strong> untuk menjadikannya menu hari ini.
            </span>
            <span v-else>
              Jelajahi pilihan resep rumahan lainnya lengkap dengan bahan &amp; cara memasaknya.
            </span>
          </p>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:self-auto dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          @click="showAddRecipe = true"
        >
          <Plus class="h-3.5 w-3.5" />
          Tambah Rekomendasi Lainnya
        </button>
      </div>

      <!-- Slot & Match Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="tab in [
              { value: 'all', label: 'Semua Waktu' },
              { value: 'sarapan', label: 'Sarapan' },
              { value: 'siang', label: 'Makan Siang' },
              { value: 'malam', label: 'Makan Malam' },
            ] as const"
            :key="tab.value"
            type="button"
            class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
            :class="
              altSlotFilter === tab.value
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800 dark:hover:bg-stone-800'
            "
            @click="altSlotFilter = tab.value; visibleAltLimit = 6"
          >
            {{ tab.label }}
          </button>
        </div>

        <label
          v-if="store.fridgeIngredients.length > 0"
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
        >
          <input
            v-model="onlyMatchedAlt"
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          >
          Hanya yang cocok bahan kulkas
        </label>
      </div>

      <!-- Alternative Recommendations Grid -->
      <div v-if="visibleOtherRecommendations.length > 0" class="grid gap-5 lg:grid-cols-3">
        <MealCard
          v-for="entry in visibleOtherRecommendations"
          :key="entry.recipe.id"
          :entry="entry"
          mode="alternative"
          :selected-slot="getSelectedSlotForRecipe(entry.recipe.id)"
          :is-item-checked="store.isShoppingItemChecked"
          :get-item-key="getShoppingItemKey"
          @select="handleSelectAlternative"
          @open-cooking="openCookingModal"
          @delete-custom="handleDeleteCustomRecipe"
          @toggle-item="store.toggleShoppingItem"
        />
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
      >
        Belum ada rekomendasi lain yang cocok dengan filter ini. Coba matikan filter atau tambahkan resep versimu sendiri!
      </div>

      <!-- Load More Button -->
      <div v-if="remainingOtherCount > 0" class="flex justify-center pt-1">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
          @click="visibleAltLimit += 6"
        >
          <ChevronDown class="h-4 w-4" />
          Tampilkan Lebih Banyak ({{ remainingOtherCount }} menu lainnya)
        </button>
      </div>
    </section>

    <!-- Focused Cooking Mode Modal -->
    <MealCookingModeModal
      v-if="cookingModalEntry"
      :entry="cookingModalEntry"
      :active-slot="cookingModalActiveSlot"
      :is-item-checked="store.isShoppingItemChecked"
      :get-item-key="getShoppingItemKey"
      @close="cookingModalEntry = null"
      @assign-slot="handleAssignSlotFromModal"
      @toggle-item="store.toggleShoppingItem"
    />
  </div>
</template>
