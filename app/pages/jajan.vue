<script setup lang="ts">
import { ArrowRight, ChefHat, Clock, Shuffle, Sparkles, UtensilsCrossed, Wallet } from 'lucide-vue-next'
import { useAppToast } from '~/composables/useAppToast'
import { useJajanParser } from '~/composables/useJajanParser'
import { useMealGenerator } from '~/composables/useMealGenerator'
import type { GeneratedMealEntry, MealSlot, Recipe } from '~/types'
import { formatRupiah } from '~/utils/format'

useHead({
  title: 'Jajan Tracker 1-Klik — HarianKu',
})

const { showToast } = useAppToast()
const {
  store,
  currentMonthLabel,
  remainingDaysInMonth,
  todayExpenses,
  earlierMonthExpenses,
  spentThisMonth,
  spentToday,
  remainingMonthlyBudget,
  dailyAllowanceStart,
  remainingTodayAllowance,
  isOverDailyLimit,
  isNearDailyLimit,
  todayUsagePercent,
  submitQuickInput,
} = useJajanParser()

const {
  store: mealStore,
  budgetMealPackages,
  shuffleBudgetCombo,
  applyBudgetMealPlan,
  selectRecipeForSlot,
  getSelectedSlotForRecipe,
  getShoppingItemKey,
} = useMealGenerator()

const selectedPkgId = ref<'pas' | 'hemat' | 'variasi'>('pas')
const cookingModalEntry = ref<GeneratedMealEntry | null>(null)

const activeBudgetPackage = computed(() =>
  budgetMealPackages.value.find(p => p.id === selectedPkgId.value) ?? budgetMealPackages.value[0] ?? null,
)

const cookingModalActiveSlot = computed<MealSlot | null>(() => {
  if (!cookingModalEntry.value) return null
  return getSelectedSlotForRecipe(cookingModalEntry.value.recipe.id)
})

function handleQuickSubmit(raw: string) {
  const res = submitQuickInput(raw)
  if (res.success) {
    showToast(
      `Tercatat: ${res.expense.label} (${formatRupiah(res.expense.amount)})`,
      isOverDailyLimit.value ? 'warning' : 'success',
    )
  } else {
    showToast(res.error, 'warning')
  }
}

function handleUpdateBudget(amount: number) {
  store.setMonthlyBudget(amount)
  showToast(`Bujet jajan bulanan diubah menjadi ${formatRupiah(amount)}.`, 'success')
}

function handleRemoveExpense(id: string) {
  store.removeExpense(id)
  showToast('Catatan jajan dihapus.', 'info')
}

function handleUseBudgetPackage() {
  if (!activeBudgetPackage.value) return
  if (applyBudgetMealPlan(activeBudgetPackage.value.meals)) {
    showToast(`"${activeBudgetPackage.value.title}" (3x makan) dipasang ke halaman Masak Apa!`, 'success')
  }
}

function handleShufflePackage() {
  selectedPkgId.value = 'variasi'
  shuffleBudgetCombo()
}

function handleAssignSlotFromModal(payload: { recipe: Recipe; slot: MealSlot }) {
  selectRecipeForSlot(payload.recipe, payload.slot)
  const slotText = payload.slot === 'sarapan' ? 'Sarapan' : payload.slot === 'siang' ? 'Makan Siang' : 'Makan Malam'
  showToast(`"${payload.recipe.name}" dipasang untuk ${slotText} Hari Ini!`, 'success')
}

function slotLabel(slot: MealSlot) {
  if (slot === 'sarapan') return 'Sarapan'
  if (slot === 'siang') return 'Makan Siang'
  return 'Makan Malam'
}

function slotBadgeClass(slot: MealSlot) {
  if (slot === 'sarapan') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  if (slot === 'siang') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <section>
      <div class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
        <Wallet class="h-3.5 w-3.5" />
        Daily Expense & Smart Parser
      </div>
      <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
        Jajan Tracker 1-Klik
      </h1>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Cukup ketik gaya bahasa sehari-hari seperti <code class="rounded bg-stone-200/70 px-1.5 py-0.5 text-xs font-semibold dark:bg-stone-800">25rb kopi</code> atau <code class="rounded bg-stone-200/70 px-1.5 py-0.5 text-xs font-semibold dark:bg-stone-800">12.5k gorengan</code> lalu Enter.
      </p>
    </section>

    <!-- Daily Allowance Hero Card -->
    <JajanDailyAllowanceCard
      :monthly-budget="store.monthlyBudget"
      :spent-today="spentToday"
      :spent-this-month="spentThisMonth"
      :remaining-monthly-budget="remainingMonthlyBudget"
      :daily-allowance-start="dailyAllowanceStart"
      :remaining-today-allowance="remainingTodayAllowance"
      :remaining-days-in-month="remainingDaysInMonth"
      :current-month-label="currentMonthLabel"
      :is-over-daily-limit="isOverDailyLimit"
      :is-near-daily-limit="isNearDailyLimit"
      :today-usage-percent="todayUsagePercent"
      @update-budget="handleUpdateBudget"
    />

    <!-- Super Fast Smart Text Parser Input -->
    <section class="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
      <div class="mb-3">
        <h2 class="text-base font-bold text-stone-900 dark:text-white">
          Input Cepat (Smart Text Parser)
        </h2>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          Tanpa form kategori rumit — angka &amp; label otomatis dipisahkan saat tekan Enter.
        </p>
      </div>
      <JajanQuickInput show-presets @submitted="handleQuickSubmit" />
    </section>

    <!-- Full 3-Meal Budget Plan Section -->
    <section
      v-if="activeBudgetPackage"
      class="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 p-5 shadow-xs dark:border-teal-900/70 dark:from-teal-950/30 dark:via-stone-900 dark:to-emerald-950/20"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            <UtensilsCrossed class="h-3 w-3" />
            Paket 3 Kali Makan Sesuai Uang Bulanan
          </div>
          <h2 class="mt-1.5 text-base font-extrabold text-stone-900 dark:text-white">
            Sarapan, Makan Siang &amp; Makan Malam Hari Ini
          </h2>
          <p class="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
            Total 3x makan: <strong class="text-teal-700 tabular-nums dark:text-teal-300">~{{ formatRupiah(activeBudgetPackage.totalCost) }}</strong>
            <span v-if="activeBudgetPackage.leftoverAfterMeals >= 0 && activeBudgetPackage.targetBudget > 0">
              · Masih sisa <strong class="text-emerald-700 tabular-nums dark:text-emerald-400">{{ formatRupiah(activeBudgetPackage.leftoverAfterMeals) }}</strong> dari jatah hari ini
            </span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            @click="handleShufflePackage"
          >
            <Shuffle class="h-3.5 w-3.5" />
            Acak Paket
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 active:scale-95"
            @click="handleUseBudgetPackage"
          >
            <Sparkles class="h-3.5 w-3.5" />
            Pasang Paket 3x Makan
          </button>
          <NuxtLink
            to="/menu"
            class="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            Atur Bahan
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>

      <!-- Package Selector Pills -->
      <div class="mt-3.5 flex flex-wrap gap-1.5">
        <button
          v-for="pkg in budgetMealPackages"
          :key="pkg.id"
          type="button"
          class="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
          :class="
            selectedPkgId === pkg.id
              ? 'border-teal-600 bg-teal-600 text-white'
              : 'border-stone-200 bg-white text-stone-700 hover:border-teal-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
          "
          @click="selectedPkgId = pkg.id"
        >
          {{ pkg.title }} · ~{{ formatRupiah(pkg.totalCost) }}
        </button>
      </div>

      <!-- 3x Makan Grid: Sarapan, Makan Siang, Makan Malam -->
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          v-for="entry in activeBudgetPackage.meals"
          :key="`jajan-3x-${entry.slot}-${entry.recipe.id}`"
          type="button"
          class="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 text-left transition hover:border-teal-400 hover:shadow-xs dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
          @click="cookingModalEntry = entry"
        >
          <div>
            <div class="flex items-center justify-between gap-2">
              <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold" :class="slotBadgeClass(entry.slot)">
                {{ slotLabel(entry.slot) }}
              </span>
              <span class="text-xs font-extrabold text-teal-700 tabular-nums dark:text-teal-300">
                ~{{ formatRupiah(entry.recipe.estimatedCost) }}
              </span>
            </div>

            <p class="mt-2 text-sm leading-snug font-bold text-stone-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
              {{ entry.recipe.name }}
            </p>
            <p class="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              Bahan: {{ entry.recipe.ingredients.map(i => i.name).join(', ') }}
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] dark:border-stone-800">
            <span class="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <Clock class="h-3 w-3" />
              {{ entry.recipe.cookingMinutes }} mnt
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <ChefHat class="h-3 w-3" />
              Cara Masak
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Expense Lists -->
    <div class="grid gap-5 lg:grid-cols-2">
      <JajanExpenseList
        title="Jajan Hari Ini"
        :expenses="todayExpenses"
        empty-text="Belum ada jajan hari ini. Mantap, dompet masih utuh!"
        @remove="handleRemoveExpense"
      />
      <JajanExpenseList
        title="Riwayat Bulan Ini"
        :expenses="earlierMonthExpenses"
        show-date
        empty-text="Belum ada riwayat jajan di hari-hari sebelumnya bulan ini."
        @remove="handleRemoveExpense"
      />
    </div>

    <!-- Focused Cooking Mode Modal right on Jajan Page -->
    <MealCookingModeModal
      v-if="cookingModalEntry"
      :entry="cookingModalEntry"
      :active-slot="cookingModalActiveSlot"
      :is-item-checked="mealStore.isShoppingItemChecked"
      :get-item-key="getShoppingItemKey"
      @close="cookingModalEntry = null"
      @assign-slot="handleAssignSlotFromModal"
      @toggle-item="mealStore.toggleShoppingItem"
    />
  </div>
</template>
