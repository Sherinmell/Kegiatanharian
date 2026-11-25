<script setup lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  RefreshCw,
  ShoppingBasket,
  UtensilsCrossed,
  Wallet,
} from 'lucide-vue-next'
import { useAppToast } from '~/composables/useAppToast'
import { useChoresTracker } from '~/composables/useChoresTracker'
import { useJajanParser } from '~/composables/useJajanParser'
import { useMealGenerator } from '~/composables/useMealGenerator'
import { formatRupiah, formatTanggalLengkap, getGreetingID } from '~/utils/format'

useHead({
  title: 'Ringkasan Hari Ini — HarianKu',
})

const { showToast } = useAppToast()
const {
  dailyMeals,
  uncheckedShoppingCount,
  shuffleAllMeals,
} = useMealGenerator()

const {
  sortedChores,
  summaryStats,
  completeToday,
} = useChoresTracker()

const {
  spentToday,
  dailyAllowanceStart,
  remainingTodayAllowance,
  isOverDailyLimit,
  isNearDailyLimit,
  todayUsagePercent,
  remainingDaysInMonth,
  submitQuickInput,
} = useJajanParser()

const greeting = ref('Halo')
const todayFormatted = ref('')

onMounted(() => {
  const now = new Date()
  greeting.value = getGreetingID(now)
  todayFormatted.value = formatTanggalLengkap(now)
})

const topPriorityChores = computed(() => sortedChores.value.slice(0, 3))

function handleQuickJajan(raw: string) {
  const res = submitQuickInput(raw)
  if (res.success) {
    showToast(`Tercatat: ${res.expense.label} (${formatRupiah(res.expense.amount)})`, 'success')
  } else {
    showToast(res.error, 'warning')
  }
}

function handleCompleteChore(id: string) {
  const chore = sortedChores.value.find(c => c.id === id)
  completeToday(id)
  if (chore) {
    showToast(`"${chore.title}" ditandai selesai hari ini!`, 'success')
  }
}

function handleShuffleMeals() {
  shuffleAllMeals()
  showToast('Menu harian berhasil diacak ulang!', 'info')
}

function slotBadge(slot: string) {
  if (slot === 'sarapan') return { label: 'Sarapan', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' }
  if (slot === 'siang') return { label: 'Siang', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' }
  return { label: 'Malam', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Greeting -->
    <section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
          {{ todayFormatted || 'Ringkasan Hari Ini' }}
        </p>
        <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
          {{ greeting }}, yuk bereskan hari ini!
        </h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Semua rencana makan, tugas berkala, dan jatah jajanmu dalam satu layar.
        </p>
      </div>
    </section>

    <!-- 3 Key Metrics Strip -->
    <section class="grid gap-3.5 sm:grid-cols-3">
      <!-- Jajan Card -->
      <NuxtLink
        to="/jajan"
        class="group rounded-2xl border p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
        :class="
          isOverDailyLimit
            ? 'border-rose-300 bg-rose-50/80 dark:border-rose-900/80 dark:bg-rose-950/35'
            : isNearDailyLimit
              ? 'border-amber-300 bg-amber-50/70 dark:border-amber-900/80 dark:bg-amber-950/30'
              : 'border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900'
        "
      >
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <Wallet class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Jatah Jajan Aman Hari Ini
          </span>
          <ArrowRight class="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5" />
        </div>
        <p
          class="mt-2 text-2xl font-extrabold tabular-nums"
          :class="
            isOverDailyLimit
              ? 'text-rose-600 dark:text-rose-400'
              : isNearDailyLimit
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-emerald-700 dark:text-emerald-400'
          "
        >
          {{ formatRupiah(remainingTodayAllowance) }}
        </p>
        <div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="isOverDailyLimit ? 'bg-rose-500' : isNearDailyLimit ? 'bg-amber-500' : 'bg-emerald-500'"
            :style="{ width: `${todayUsagePercent}%` }"
          />
        </div>
        <p class="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
          Terpakai {{ formatRupiah(spentToday) }} / {{ formatRupiah(dailyAllowanceStart) }} · Sisa {{ remainingDaysInMonth }} hari
        </p>
      </NuxtLink>

      <!-- Chores Card -->
      <NuxtLink
        to="/tugas"
        class="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
      >
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <CheckSquare class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Pengingat Tugas Rumah
          </span>
          <ArrowRight class="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5" />
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <p
            class="text-2xl font-extrabold tabular-nums"
            :class="summaryStats.urgent > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'"
          >
            {{ summaryStats.urgent }} Urgent
          </p>
          <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
            · {{ summaryStats.warning }} mendekati
          </span>
        </div>
        <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
          {{ summaryStats.safe }} dari {{ summaryStats.total }} tugas berkala masih dalam status aman.
        </p>
      </NuxtLink>

      <!-- Meal Card -->
      <NuxtLink
        to="/menu"
        class="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
      >
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <UtensilsCrossed class="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Menu & Belanja Hari Ini
          </span>
          <ArrowRight class="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5" />
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="text-2xl font-extrabold text-stone-900 tabular-nums dark:text-white">
            3 Menu
          </p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <ShoppingBasket class="h-3.5 w-3.5" />
            {{ uncheckedShoppingCount }} bahan belanja
          </span>
        </div>
        <p class="mt-2 truncate text-xs text-stone-500 dark:text-stone-400">
          Siang: {{ dailyMeals[1]?.recipe.name }}
        </p>
      </NuxtLink>
    </section>

    <!-- Quick Jajan Smart Input Bar right on Dashboard -->
    <section class="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5 dark:border-stone-800 dark:bg-stone-900">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-bold text-stone-900 sm:text-base dark:text-white">
            Catat Jajan Kilat
          </h2>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            Langsung ketik nominal & keterangan, sisa jatah hari ini langsung terpotong otomatis.
          </p>
        </div>
        <span
          v-if="isOverDailyLimit"
          class="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          <AlertTriangle class="h-3.5 w-3.5" />
          Over Jatah
        </span>
      </div>
      <JajanQuickInput :show-presets="false" compact @submitted="handleQuickJajan" />
    </section>

    <!-- Main 2-Column Overview Grid -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Left: Priority Chores -->
      <section class="space-y-3.5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-stone-900 dark:text-white">
              Tugas Perlu Perhatian
            </h2>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              Diurutkan otomatis dari sisa waktu paling mepet
            </p>
          </div>
          <NuxtLink
            to="/tugas"
            class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Lihat semua
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>

        <div class="space-y-3">
          <ChoresChoreCard
            v-for="chore in topPriorityChores"
            :key="chore.id"
            :chore="chore"
            compact
            @complete="handleCompleteChore"
          />
        </div>
      </section>

      <!-- Right: Today's Meal Plan Preview -->
      <section class="space-y-3.5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-stone-900 dark:text-white">
              Rencana Menu Hari Ini
            </h2>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              Disesuaikan dengan bahan di kulkasmu
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              @click="handleShuffleMeals"
            >
              <RefreshCw class="h-3.5 w-3.5" />
              Acak
            </button>
            <NuxtLink
              to="/menu"
              class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Atur menu
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="entry in dailyMeals"
            :key="entry.slot"
            class="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                    :class="slotBadge(entry.slot).cls"
                  >
                    {{ slotBadge(entry.slot).label }}
                  </span>
                  <span class="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                    <Clock class="h-3 w-3" />
                    {{ entry.recipe.cookingMinutes }} mnt
                  </span>
                  <span class="text-xs font-medium text-stone-500 dark:text-stone-400">
                    · ~{{ formatRupiah(entry.recipe.estimatedCost) }}
                  </span>
                </div>
                <h3 class="mt-1.5 text-sm font-bold text-stone-900 sm:text-base dark:text-white">
                  {{ entry.recipe.name }}
                </h3>
              </div>
            </div>

            <div class="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span
                v-if="entry.matchedIngredients.length > 0"
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <CheckCircle2 class="h-3 w-3" />
                {{ entry.matchedIngredients.length }} bahan tersedia
              </span>
              <span
                v-if="entry.missingIngredients.length > 0"
                class="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              >
                <ShoppingBasket class="h-3 w-3" />
                Kurang {{ entry.missingIngredients.length }} bahan
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
