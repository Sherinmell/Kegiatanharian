import { watch } from 'vue'
import { useCloudSync } from '~/composables/useCloudSync'
import { useChoresStore } from '~/stores/chores'
import { useJajanStore } from '~/stores/jajan'
import { useMealStore } from '~/stores/meal'
import type { ChoreItem, JajanExpense, Recipe } from '~/types'

interface CloudStateResponse {
  connected: boolean
  customRecipes?: Recipe[]
  chores?: ChoreItem[]
  expenses?: JajanExpense[]
  preferences?: Record<string, unknown>
}

export default defineNuxtPlugin(() => {
  const { status, isHydrating, pushToCloud } = useCloudSync()
  const mealStore = useMealStore()
  const choresStore = useChoresStore()
  const jajanStore = useJajanStore()

  async function initSync() {
    status.value = 'syncing'
    isHydrating.value = true
    try {
      const data = await $fetch<CloudStateResponse>('/api/state')
      if (data?.connected) {
        mealStore.hydrateFromCloud({
          customRecipes: data.customRecipes,
          preferences: data.preferences,
        })
        choresStore.hydrateFromCloud(data.chores)
        jajanStore.hydrateFromCloud({
          expenses: data.expenses,
          monthlyBudget: typeof data.preferences?.monthly_budget === 'number'
            ? data.preferences.monthly_budget
            : undefined,
        })
        status.value = 'connected'
      } else {
        status.value = 'offline'
      }
    } catch {
      status.value = 'offline'
    } finally {
      isHydrating.value = false
    }
  }

  void initSync()

  // Sinkronkan filter meal saat pengguna mengubahnya
  watch(() => mealStore.cookingTime, (val) => {
    void pushToCloud('/api/preferences', 'PUT', { key: 'cooking_time', value: val })
  })
  watch(() => mealStore.budget, (val) => {
    void pushToCloud('/api/preferences', 'PUT', { key: 'budget_tier', value: val })
  })
  watch(() => mealStore.onlyExactFridgeMode, (val) => {
    void pushToCloud('/api/preferences', 'PUT', { key: 'only_exact_fridge_mode', value: val })
  })
})
