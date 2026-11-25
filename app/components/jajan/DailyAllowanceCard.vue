<script setup lang="ts">
import { AlertTriangle, Check, Edit3, ShieldCheck, Wallet, X } from 'lucide-vue-next'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  monthlyBudget: number
  spentToday: number
  spentThisMonth: number
  remainingMonthlyBudget: number
  dailyAllowanceStart: number
  remainingTodayAllowance: number
  remainingDaysInMonth: number
  currentMonthLabel: string
  isOverDailyLimit: boolean
  isNearDailyLimit: boolean
  todayUsagePercent: number
}>()

const emit = defineEmits<{
  updateBudget: [amount: number]
}>()

const isEditingBudget = ref(false)
const budgetInput = ref(String(props.monthlyBudget))

function openBudgetEdit() {
  budgetInput.value = String(props.monthlyBudget)
  isEditingBudget.value = true
}

function saveBudget() {
  const cleaned = Number(budgetInput.value.replace(/[^\d]/g, ''))
  if (Number.isFinite(cleaned) && cleaned >= 0) {
    emit('updateBudget', cleaned)
    isEditingBudget.value = false
  }
}

const statusTheme = computed(() => {
  if (props.isOverDailyLimit) {
    return {
      card: 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-rose-50/70 dark:border-rose-800/80 dark:from-rose-950/50 dark:via-stone-900 dark:to-rose-950/30',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      amount: 'text-rose-600 dark:text-rose-400',
      barTrack: 'bg-rose-200/70 dark:bg-rose-950',
      barFill: 'bg-rose-500',
      statusText: 'Melebihi jatah harian!',
    }
  }
  if (props.isNearDailyLimit) {
    return {
      card: 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/70 dark:border-amber-800/80 dark:from-amber-950/40 dark:via-stone-900 dark:to-amber-950/20',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      amount: 'text-amber-700 dark:text-amber-400',
      barTrack: 'bg-amber-200/70 dark:bg-amber-950',
      barFill: 'bg-amber-500',
      statusText: 'Hampir mencapai batas hari ini',
    }
  }
  return {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:border-emerald-900/70 dark:from-emerald-950/40 dark:via-stone-900 dark:to-teal-950/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amount: 'text-emerald-700 dark:text-emerald-400',
    barTrack: 'bg-emerald-200/70 dark:bg-emerald-950',
    barFill: 'bg-emerald-500',
    statusText: 'Masih dalam batas aman',
  }
})
</script>

<template>
  <section class="rounded-2xl border p-5 shadow-xs transition-colors sm:p-6" :class="statusTheme.card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold"
            :class="statusTheme.badge"
          >
            <AlertTriangle v-if="isOverDailyLimit || isNearDailyLimit" class="h-3.5 w-3.5" />
            <ShieldCheck v-else class="h-3.5 w-3.5" />
            {{ statusTheme.statusText }}
          </span>
          <span class="text-xs font-medium text-stone-500 dark:text-stone-400">
            {{ currentMonthLabel }}
          </span>
        </div>

        <p class="mt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
          Sisa Jatah Jajan Aman Hari Ini
        </p>
        <p class="mt-1 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl" :class="statusTheme.amount">
          {{ formatRupiah(remainingTodayAllowance) }}
        </p>
        <p class="mt-1 text-xs text-stone-600 dark:text-stone-300">
          Jatah awal hari ini <strong class="tabular-nums">{{ formatRupiah(dailyAllowanceStart) }}</strong>
          · Terpakai hari ini <strong class="tabular-nums">{{ formatRupiah(spentToday) }}</strong>
        </p>
      </div>

      <!-- Monthly Budget Quick Edit -->
      <div class="rounded-2xl border border-stone-200/80 bg-white/90 p-3 text-right backdrop-blur-xs dark:border-stone-800 dark:bg-stone-900/90">
        <div class="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
          <Wallet class="h-3.5 w-3.5" />
          <span>Bujet Bulanan</span>
        </div>

        <div v-if="!isEditingBudget" class="mt-1 flex items-center justify-end gap-2">
          <span class="text-base font-extrabold tabular-nums text-stone-900 dark:text-white">
            {{ formatRupiah(monthlyBudget) }}
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-600 transition hover:bg-emerald-100 hover:text-emerald-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
            @click="openBudgetEdit"
          >
            <Edit3 class="h-3 w-3" />
            Ubah
          </button>
        </div>

        <form v-else class="mt-1.5 flex items-center gap-1.5" @submit.prevent="saveBudget">
          <input
            v-model="budgetInput"
            type="text"
            inputmode="numeric"
            class="w-28 rounded-lg border border-emerald-400 bg-white px-2 py-1 text-right text-sm font-bold tabular-nums text-stone-900 focus:outline-none dark:bg-stone-800 dark:text-white"
            aria-label="Nominal bujet bulanan"
          >
          <button
            type="submit"
            class="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
            aria-label="Simpan bujet"
          >
            <Check class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="rounded-lg bg-stone-200 p-1.5 text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200"
            aria-label="Batal ubah bujet"
            @click="isEditingBudget = false"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>

    <!-- Today Usage Progress -->
    <div class="mt-5 space-y-1.5">
      <div class="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300">
        <span>Pemakaian jatah hari ini</span>
        <span class="font-bold tabular-nums">{{ todayUsagePercent }}%</span>
      </div>
      <div class="h-2.5 w-full overflow-hidden rounded-full" :class="statusTheme.barTrack">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="statusTheme.barFill"
          :style="{ width: `${todayUsagePercent}%` }"
        />
      </div>
    </div>

    <!-- Monthly Breakdown Pills -->
    <div class="mt-5 grid grid-cols-3 gap-2.5">
      <div class="rounded-xl bg-white/80 p-3 dark:bg-stone-900/70">
        <p class="text-[11px] font-medium text-stone-500 dark:text-stone-400">Terpakai Bulan Ini</p>
        <p class="mt-0.5 text-sm font-bold tabular-nums text-stone-900 dark:text-white">
          {{ formatRupiah(spentThisMonth) }}
        </p>
      </div>
      <div class="rounded-xl bg-white/80 p-3 dark:bg-stone-900/70">
        <p class="text-[11px] font-medium text-stone-500 dark:text-stone-400">Sisa Bujet Bulan</p>
        <p
          class="mt-0.5 text-sm font-bold tabular-nums"
          :class="remainingMonthlyBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-white'"
        >
          {{ formatRupiah(remainingMonthlyBudget) }}
        </p>
      </div>
      <div class="rounded-xl bg-white/80 p-3 dark:bg-stone-900/70">
        <p class="text-[11px] font-medium text-stone-500 dark:text-stone-400">Sisa Hari Bulan Ini</p>
        <p class="mt-0.5 text-sm font-bold tabular-nums text-stone-900 dark:text-white">
          {{ remainingDaysInMonth }} hari
        </p>
      </div>
    </div>
  </section>
</template>
