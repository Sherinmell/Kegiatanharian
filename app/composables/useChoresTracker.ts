import { computed } from 'vue'
import { useChoresStore } from '~/stores/chores'
import type { ChoreCategory, ChoreComputed, ChoreStatus } from '~/types'
import { diffDays, getLocalDateKey, offsetDateKey, parseDateKey } from '~/utils/format'

export const CHORE_CATEGORIES: { value: ChoreCategory; label: string }[] = [
  { value: 'rumah', label: 'Rumah & Kamar' },
  { value: 'dapur', label: 'Dapur & Minum' },
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'tanaman', label: 'Tanaman' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const INTERVAL_PRESETS = [
  { days: 2, label: '2 hari' },
  { days: 3, label: '3 hari' },
  { days: 7, label: '7 hari' },
  { days: 14, label: '14 hari' },
  { days: 30, label: '30 hari' },
] as const

export function useChoresTracker() {
  const store = useChoresStore()

  const todayKey = computed(() => getLocalDateKey())

  const computedChores = computed<ChoreComputed[]>(() => {
    const today = todayKey.value
    return store.chores.map((chore) => {
      const interval = Math.max(1, chore.intervalDays)
      const daysElapsed = Math.max(0, diffDays(today, chore.lastDoneAt))
      const daysRemaining = interval - daysElapsed
      const remainingPercent = Math.round((daysRemaining / interval) * 100)
      const progressWidth = Math.max(0, Math.min(100, remainingPercent))
      const nextDueDate = offsetDateKey(interval, parseDateKey(chore.lastDoneAt))

      let status: ChoreStatus = 'safe'
      if (remainingPercent < 20) {
        status = 'urgent'
      } else if (remainingPercent <= 50) {
        status = 'warning'
      }

      let statusText: string
      if (daysRemaining < 0) {
        statusText = `Terlewat ${Math.abs(daysRemaining)} hari`
      } else if (daysRemaining === 0) {
        statusText = 'Waktunya hari ini!'
      } else if (daysRemaining === 1) {
        statusText = 'Besok'
      } else {
        statusText = `${daysRemaining} hari lagi`
      }

      return {
        ...chore,
        daysElapsed,
        daysRemaining,
        remainingPercent,
        progressWidth,
        nextDueDate,
        status,
        statusText,
      }
    })
  })

  const sortedChores = computed<ChoreComputed[]>(() =>
    [...computedChores.value].sort((a, b) => {
      if (a.remainingPercent !== b.remainingPercent) {
        return a.remainingPercent - b.remainingPercent
      }
      return a.daysRemaining - b.daysRemaining
    }),
  )

  const urgentChores = computed(() => sortedChores.value.filter(c => c.status === 'urgent'))
  const warningChores = computed(() => sortedChores.value.filter(c => c.status === 'warning'))
  const safeChores = computed(() => sortedChores.value.filter(c => c.status === 'safe'))

  const summaryStats = computed(() => ({
    total: computedChores.value.length,
    urgent: urgentChores.value.length,
    warning: warningChores.value.length,
    safe: safeChores.value.length,
  }))

  function completeToday(id: string) {
    store.completeChoreToday(id)
  }

  function addCustomChore(payload: {
    title: string
    category: ChoreCategory
    intervalDays: number
    notes?: string
  }) {
    return store.addChore(payload)
  }

  function deleteChore(id: string) {
    store.removeChore(id)
  }

  return {
    store,
    computedChores,
    sortedChores,
    urgentChores,
    warningChores,
    safeChores,
    summaryStats,
    completeToday,
    addCustomChore,
    deleteChore,
  }
}
