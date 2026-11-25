<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Edit3,
  Shuffle,
  Sparkles,
  Wallet,
  X,
} from 'lucide-vue-next'
import type { GeneratedMealEntry } from '~/types'
import { formatRupiah } from '~/utils/format'

export interface BudgetPackage {
  id: 'pas' | 'hemat' | 'variasi'
  title: string
  subtitle: string
  meals: [GeneratedMealEntry, GeneratedMealEntry, GeneratedMealEntry]
  totalCost: number
  targetBudget: number
  fitsRemainingToday: boolean
  fitsDailyAllowance: boolean
  leftoverAfterMeals: number
}

const props = defineProps<{
  monthlyBudget: number
  remainingMonthlyBudget: number
  remainingDaysInMonth: number
  dailyAllowanceStart: number
  remainingTodayAllowance: number
  currentPlanCost: number
  packages: BudgetPackage[]
}>()

const emit = defineEmits<{
  applyPackage: [meals: [GeneratedMealEntry, GeneratedMealEntry, GeneratedMealEntry]]
  shufflePackage: []
  openCooking: [entry: GeneratedMealEntry]
  updateMonthlyBudget: [amount: number]
}>()

const selectedPackageId = ref<'pas' | 'hemat' | 'variasi'>('pas')
const isEditingBudget = ref(false)
const budgetInput = ref(String(props.monthlyBudget))

const activePackage = computed(() =>
  props.packages.find(p => p.id === selectedPackageId.value) ?? props.packages[0] ?? null,
)

function openEdit() {
  budgetInput.value = String(props.monthlyBudget)
  isEditingBudget.value = true
}

function saveBudget() {
  const cleaned = Number(budgetInput.value.replace(/[^\d]/g, ''))
  if (Number.isFinite(cleaned) && cleaned >= 0) {
    emit('updateMonthlyBudget', cleaned)
    isEditingBudget.value = false
  }
}

function handleShuffleVariant() {
  selectedPackageId.value = 'variasi'
  emit('shufflePackage')
}

const activeDailyLimit = computed(() =>
  props.remainingTodayAllowance > 0 ? props.remainingTodayAllowance : Math.max(0, props.dailyAllowanceStart),
)

const isCurrentPlanSafe = computed(() =>
  activeDailyLimit.value > 0 && props.currentPlanCost <= activeDailyLimit.value,
)

function slotName(slot: string) {
  if (slot === 'sarapan') return 'Sarapan'
  if (slot === 'siang') return 'Makan Siang'
  return 'Makan Malam'
}

function slotBadgeClass(slot: string) {
  if (slot === 'sarapan') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  if (slot === 'siang') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
}
</script>

<template>
  <section class="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 p-5 shadow-xs dark:border-teal-900/70 dark:from-teal-950/35 dark:via-stone-900 dark:to-emerald-950/25">
    <!-- Top Header + Monthly Money Summary -->
    <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
          <Wallet class="h-3.5 w-3.5" />
          Menu 3 Kali Makan · Sinkron Uang Bulanan
        </div>
        <h2 class="text-lg font-extrabold text-stone-900 dark:text-white">
          Paket 3x Makan Sesuai Uang Bulananmu
        </h2>
        <p class="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          Rekomendasi lengkap <strong>Sarapan + Makan Siang + Makan Malam</strong> sesuai sisa uang bulanan dibagi <strong>{{ remainingDaysInMonth }} hari tersisa</strong>.
        </p>
      </div>

      <!-- Editable Monthly Money Pills -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="rounded-2xl border border-stone-200/90 bg-white/95 px-3.5 py-2.5 dark:border-stone-800 dark:bg-stone-900/95">
          <p class="text-[10px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
            Uang Bulanan
          </p>
          <div v-if="!isEditingBudget" class="mt-0.5 flex items-center gap-2">
            <span class="text-sm font-extrabold tabular-nums text-stone-900 dark:text-white">
              {{ formatRupiah(monthlyBudget) }}
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 transition hover:bg-teal-100 hover:text-teal-800 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-teal-950 dark:hover:text-teal-300"
              @click="openEdit"
            >
              <Edit3 class="h-3 w-3" />
              Ubah
            </button>
          </div>
          <form v-else class="mt-1 flex items-center gap-1" @submit.prevent="saveBudget">
            <input
              v-model="budgetInput"
              type="text"
              inputmode="numeric"
              class="w-28 rounded-lg border border-teal-500 bg-white px-2 py-1 text-right text-xs font-bold tabular-nums text-stone-900 focus:outline-none dark:bg-stone-800 dark:text-white"
              aria-label="Nominal uang bulanan"
            >
            <button type="submit" class="rounded-lg bg-teal-600 p-1 text-white hover:bg-teal-700" aria-label="Simpan">
              <Check class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              class="rounded-lg bg-stone-200 p-1 text-stone-700 dark:bg-stone-700 dark:text-stone-200"
              aria-label="Batal"
              @click="isEditingBudget = false"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <div class="rounded-2xl border border-stone-200/90 bg-white/95 px-3.5 py-2.5 dark:border-stone-800 dark:bg-stone-900/95">
          <p class="text-[10px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
            Sisa Uang Bulan Ini
          </p>
          <p
            class="mt-0.5 text-sm font-extrabold tabular-nums"
            :class="remainingMonthlyBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-white'"
          >
            {{ formatRupiah(remainingMonthlyBudget) }}
          </p>
        </div>

        <div class="rounded-2xl border border-teal-200 bg-teal-50/90 px-3.5 py-2.5 dark:border-teal-800 dark:bg-teal-950/60">
          <p class="text-[10px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
            Sisa Jatah Hari Ini
          </p>
          <p
            class="mt-0.5 text-sm font-extrabold tabular-nums"
            :class="remainingTodayAllowance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-teal-800 dark:text-teal-200'"
          >
            {{ formatRupiah(remainingTodayAllowance) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Current Plan vs Budget Status Banner -->
    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs"
      :class="
        isCurrentPlanSafe
          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
      "
    >
      <div class="flex items-center gap-2 font-semibold">
        <CheckCircle2 v-if="isCurrentPlanSafe" class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <AlertTriangle v-else class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span v-if="isCurrentPlanSafe">
          Menu utamamu saat ini (~{{ formatRupiah(currentPlanCost) }}) aman masuk jatah harian! Sisa {{ formatRupiah(activeDailyLimit - currentPlanCost) }}.
        </span>
        <span v-else-if="activeDailyLimit > 0">
          Menu utamamu saat ini (~{{ formatRupiah(currentPlanCost) }}) melebihi sisa jatah harian ({{ formatRupiah(activeDailyLimit) }}). Pilih salah satu paket 3x makan di bawah!
        </span>
        <span v-else>
          Jatah harianmu sudah terpakai habis hari ini — pilih Paket Super Hemat atau masak dari bahan yang ada di kulkas.
        </span>
      </div>
    </div>

    <!-- Package Tabs (3 Choices of 3x Makan) -->
    <div v-if="packages.length > 0 && activePackage" class="mt-4 space-y-3.5">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="pkg in packages"
            :key="pkg.id"
            type="button"
            class="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
            :class="
              selectedPackageId === pkg.id
                ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                : 'border-stone-200 bg-white text-stone-700 hover:border-teal-300 hover:bg-teal-50/60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
            "
            @click="selectedPackageId = pkg.id"
          >
            {{ pkg.title }} · ~{{ formatRupiah(pkg.totalCost) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            @click="handleShuffleVariant"
          >
            <Shuffle class="h-3.5 w-3.5" />
            Acak Paket Lain
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 active:scale-95"
            @click="emit('applyPackage', activePackage.meals)"
          >
            <Sparkles class="h-3.5 w-3.5" />
            Pakai Paket 3x Makan Ini
          </button>
        </div>
      </div>

      <!-- Active Package Subtitle + Total -->
      <p class="text-xs text-stone-600 dark:text-stone-300">
        <strong>{{ activePackage.title }}</strong> — {{ activePackage.subtitle }}.
        Total 3x makan:
        <strong class="text-teal-700 tabular-nums dark:text-teal-300">~{{ formatRupiah(activePackage.totalCost) }}</strong>
        <span v-if="activePackage.leftoverAfterMeals >= 0 && activePackage.targetBudget > 0">
          · Sisa uang hari ini setelah 3x makan:
          <strong class="text-emerald-700 tabular-nums dark:text-emerald-400">{{ formatRupiah(activePackage.leftoverAfterMeals) }}</strong>
        </span>
      </p>

      <!-- 3 Meal Cards (Sarapan, Makan Siang, Makan Malam) -->
      <div class="grid gap-3 md:grid-cols-3">
        <button
          v-for="entry in activePackage.meals"
          :key="`budget-pkg-${activePackage.id}-${entry.slot}-${entry.recipe.id}`"
          type="button"
          class="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 text-left transition hover:border-teal-400 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
          @click="emit('openCooking', entry)"
        >
          <div>
            <div class="flex items-center justify-between gap-2">
              <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold" :class="slotBadgeClass(entry.slot)">
                {{ slotName(entry.slot) }}
              </span>
              <span class="text-xs font-extrabold text-teal-700 tabular-nums dark:text-teal-300">
                ~{{ formatRupiah(entry.recipe.estimatedCost) }}
              </span>
            </div>

            <h3 class="mt-2 text-sm leading-snug font-bold text-stone-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
              {{ entry.recipe.name }}
            </h3>

            <p class="mt-1.5 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              Bahan: {{ entry.recipe.ingredients.map(i => i.name).join(', ') }}
            </p>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] dark:border-stone-800">
            <span class="inline-flex items-center gap-1 font-medium text-stone-500 dark:text-stone-400">
              <Clock class="h-3 w-3" />
              {{ entry.recipe.cookingMinutes }} mnt
              <span v-if="entry.isExactMatch" class="ml-1 font-bold text-emerald-600 dark:text-emerald-400">· Tanpa Belanja</span>
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400">
              <ChefHat class="h-3 w-3" />
              Resep &amp; Masak
            </span>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
