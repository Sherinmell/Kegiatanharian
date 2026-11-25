<script setup lang="ts">
import {
  AlertCircle,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Droplets,
  Home,
  Leaf,
  Sparkles,
  Trash2,
} from 'lucide-vue-next'
import type { ChoreComputed } from '~/types'
import { formatTanggalPendek } from '~/utils/format'

const props = defineProps<{
  chore: ChoreComputed
  compact?: boolean
}>()

const emit = defineEmits<{
  complete: [id: string]
  delete: [id: string]
}>()

const categoryIcon = computed(() => {
  switch (props.chore.category) {
    case 'dapur':
      return Droplets
    case 'kendaraan':
      return Car
    case 'tanaman':
      return Leaf
    case 'rumah':
      return Home
    default:
      return Sparkles
  }
})

const statusStyles = computed(() => {
  switch (props.chore.status) {
    case 'urgent':
      return {
        cardBorder: 'border-rose-200 dark:border-rose-900/70',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
        barBg: 'bg-rose-100 dark:bg-rose-950/60',
        barFill: 'bg-rose-500',
        iconBox: 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400',
        label: 'Urgent',
      }
    case 'warning':
      return {
        cardBorder: 'border-amber-200 dark:border-amber-900/70',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        barBg: 'bg-amber-100 dark:bg-amber-950/60',
        barFill: 'bg-amber-500',
        iconBox: 'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
        label: 'Mendekati',
      }
    default:
      return {
        cardBorder: 'border-stone-200/90 dark:border-stone-800',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
        barBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        barFill: 'bg-emerald-500',
        iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400',
        label: 'Aman',
      }
  }
})
</script>

<template>
  <article
    class="flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition hover:shadow-md dark:bg-stone-900"
    :class="statusStyles.cardBorder"
  >
    <div>
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="statusStyles.iconBox"
          >
            <component :is="categoryIcon" class="h-5 w-5" />
          </div>

          <div class="min-w-0">
            <h3 class="text-sm font-bold text-stone-900 sm:text-base dark:text-white">
              {{ chore.title }}
            </h3>
            <div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              <span class="inline-flex items-center gap-1">
                <Clock class="h-3.5 w-3.5" />
                Tiap {{ chore.intervalDays }} hari
              </span>
              <span v-if="!compact" class="inline-flex items-center gap-1">
                <CalendarClock class="h-3.5 w-3.5" />
                Terakhir {{ formatTanggalPendek(chore.lastDoneAt) }}
              </span>
            </div>
          </div>
        </div>

        <button
          v-if="!compact"
          type="button"
          class="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          title="Hapus tugas"
          :aria-label="`Hapus tugas ${chore.title}`"
          @click="emit('delete', chore.id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>

      <p
        v-if="chore.notes && !compact"
        class="mt-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400"
      >
        {{ chore.notes }}
      </p>

      <!-- Dynamic Progress Bar -->
      <div class="mt-4 space-y-1.5">
        <div class="flex items-center justify-between gap-2 text-xs">
          <span
            class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold"
            :class="statusStyles.badge"
          >
            <AlertCircle v-if="chore.status === 'urgent'" class="h-3.5 w-3.5" />
            {{ statusStyles.label }} · {{ chore.statusText }}
          </span>
          <span class="font-semibold tabular-nums text-stone-500 dark:text-stone-400">
            {{ Math.max(0, chore.remainingPercent) }}% tersisa
          </span>
        </div>

        <div class="h-2.5 w-full overflow-hidden rounded-full" :class="statusStyles.barBg">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="statusStyles.barFill"
            :style="{ width: `${Math.max(chore.status === 'urgent' ? 6 : 0, chore.progressWidth)}%` }"
          />
        </div>
      </div>
    </div>

    <!-- 1-Click Action -->
    <div class="mt-4 flex items-center justify-between gap-2 pt-1">
      <span class="text-[11px] font-medium text-stone-400 dark:text-stone-500">
        Jadwal: {{ formatTanggalPendek(chore.nextDueDate) }}
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95"
        :class="
          chore.status === 'urgent'
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/70'
        "
        @click="emit('complete', chore.id)"
      >
        <CheckCircle2 class="h-4 w-4" />
        Selesai Hari Ini
      </button>
    </div>
  </article>
</template>
