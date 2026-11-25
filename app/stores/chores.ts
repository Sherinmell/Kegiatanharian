import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useCloudSync } from '~/composables/useCloudSync'
import type { ChoreCategory, ChoreItem } from '~/types'
import { getLocalDateKey, offsetDateKey } from '~/utils/format'

function createInitialChores(): ChoreItem[] {
  return [
    {
      id: 'chore-botol-minum',
      title: 'Cuci botol minum',
      category: 'dapur',
      intervalDays: 3,
      lastDoneAt: offsetDateKey(-4),
      notes: 'Sikat bagian tutup & karet seal agar tidak bau.',
    },
    {
      id: 'chore-kuras-galon',
      title: 'Kuras & bersihkan dispenser / galon',
      category: 'dapur',
      intervalDays: 14,
      lastDoneAt: offsetDateKey(-13),
      notes: 'Bilas tangki air hangat & lap bagian keran.',
    },
    {
      id: 'chore-siram-tanaman',
      title: 'Siram tanaman rumah',
      category: 'tanaman',
      intervalDays: 3,
      lastDoneAt: offsetDateKey(-2),
      notes: 'Siram secukupnya di pagi atau sore hari.',
    },
    {
      id: 'chore-ganti-seprai',
      title: 'Ganti seprai & sarung bantal',
      category: 'rumah',
      intervalDays: 14,
      lastDoneAt: offsetDateKey(-9),
      notes: 'Cuci dengan air hangat biar bebas tungau.',
    },
    {
      id: 'chore-filter-ac',
      title: 'Bersihkan filter AC',
      category: 'rumah',
      intervalDays: 30,
      lastDoneAt: offsetDateKey(-10),
      notes: 'Cuci jaring filter dengan air mengalir, keringkan dulu.',
    },
    {
      id: 'chore-servis-motor',
      title: 'Servis motor / ganti oli',
      category: 'kendaraan',
      intervalDays: 30,
      lastDoneAt: offsetDateKey(-8),
      notes: 'Cek tekanan ban, rem, dan kilometer oli mesin.',
    },
  ]
}

export const useChoresStore = defineStore('chores', () => {
  const { pushToCloud } = useCloudSync()

  const chores = useLocalStorage<ChoreItem[]>(
    'harianku:chores:items',
    createInitialChores(),
    { initOnMounted: true },
  )

  function completeChoreToday(id: string) {
    const today = getLocalDateKey()
    chores.value = chores.value.map(item =>
      item.id === id ? { ...item, lastDoneAt: today } : item,
    )
    void pushToCloud(`/api/chores/${encodeURIComponent(id)}`, 'PATCH', { lastDoneAt: today })
  }

  function addChore(payload: {
    title: string
    category: ChoreCategory
    intervalDays: number
    notes?: string
    lastDoneAt?: string
  }) {
    const trimmed = payload.title.trim()
    if (!trimmed) return null
    const newChore: ChoreItem = {
      id: `chore-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmed,
      category: payload.category,
      intervalDays: Math.max(1, Math.round(payload.intervalDays)),
      lastDoneAt: payload.lastDoneAt || getLocalDateKey(),
      notes: payload.notes?.trim() || undefined,
    }
    chores.value = [newChore, ...chores.value]
    void pushToCloud('/api/chores', 'POST', newChore as unknown as Record<string, unknown>)
    return newChore
  }

  function removeChore(id: string) {
    chores.value = chores.value.filter(item => item.id !== id)
    void pushToCloud(`/api/chores/${encodeURIComponent(id)}`, 'DELETE')
  }

  function hydrateFromCloud(items?: ChoreItem[]) {
    if (Array.isArray(items) && items.length > 0) {
      chores.value = items
    }
  }

  function resetToDefault() {
    chores.value = createInitialChores()
  }

  return {
    chores,
    completeChoreToday,
    addChore,
    removeChore,
    hydrateFromCloud,
    resetToDefault,
  }
})
