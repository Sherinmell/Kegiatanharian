import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useCloudSync } from '~/composables/useCloudSync'
import type { BudgetTier, CookingTimeRange, MealSlot, Recipe } from '~/types'

export const useMealStore = defineStore('meal', () => {
  const { pushToCloud } = useCloudSync()

  const fridgeIngredients = useLocalStorage<string[]>(
    'harianku:meal:ingredients',
    ['telur', 'tahu', 'sawi'],
    { initOnMounted: true },
  )

  const cookingTime = useLocalStorage<CookingTimeRange>(
    'harianku:meal:cooking-time',
    'all',
    { initOnMounted: true },
  )

  const budget = useLocalStorage<BudgetTier>(
    'harianku:meal:budget',
    'all',
    { initOnMounted: true },
  )

  const selectedRecipeIds = useLocalStorage<Record<MealSlot, string>>(
    'harianku:meal:selected-ids',
    {
      sarapan: 'sarapan-nasi-goreng-telur',
      siang: 'siang-sayur-bening-bayam-tempe',
      malam: 'malam-tahu-cabai-garam',
    },
    { initOnMounted: true },
  )

  const checkedShoppingItems = useLocalStorage<Record<string, boolean>>(
    'harianku:meal:checked-shopping',
    {},
    { initOnMounted: true },
  )

  const customRecipes = useLocalStorage<Recipe[]>(
    'harianku:meal:custom-recipes',
    [],
    { initOnMounted: true },
  )

  const onlyExactFridgeMode = useLocalStorage<boolean>(
    'harianku:meal:exact-mode',
    false,
    { initOnMounted: true },
  )

  function syncPref(key: string, value: unknown) {
    void pushToCloud('/api/preferences', 'PUT', { key, value })
  }

  function normalizeIngredient(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  function addIngredient(raw: string): boolean {
    const normalized = normalizeIngredient(raw)
    if (!normalized) return false
    if (fridgeIngredients.value.includes(normalized)) return false
    fridgeIngredients.value = [...fridgeIngredients.value, normalized]
    syncPref('fridge_ingredients', fridgeIngredients.value)
    return true
  }

  function removeIngredient(ingredient: string) {
    fridgeIngredients.value = fridgeIngredients.value.filter(item => item !== ingredient)
    syncPref('fridge_ingredients', fridgeIngredients.value)
  }

  function clearIngredients() {
    fridgeIngredients.value = []
    syncPref('fridge_ingredients', [])
  }

  function setSelectedRecipe(slot: MealSlot, recipeId: string) {
    selectedRecipeIds.value = {
      ...selectedRecipeIds.value,
      [slot]: recipeId,
    }
    syncPref('selected_recipe_ids', selectedRecipeIds.value)
  }

  function setAllSelectedRecipes(selection: Record<MealSlot, string>) {
    selectedRecipeIds.value = { ...selection }
    syncPref('selected_recipe_ids', selectedRecipeIds.value)
  }

  function toggleShoppingItem(key: string) {
    const next = { ...checkedShoppingItems.value }
    next[key] = !next[key]
    checkedShoppingItems.value = next
    syncPref('checked_shopping_items', next)
  }

  function isShoppingItemChecked(key: string): boolean {
    return Boolean(checkedShoppingItems.value[key])
  }

  function clearCheckedShopping() {
    checkedShoppingItems.value = {}
    syncPref('checked_shopping_items', {})
  }

  function addCustomRecipe(payload: Omit<Recipe, 'id' | 'isCustom'>): Recipe {
    const created: Recipe = {
      ...payload,
      id: `custom-${payload.slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isCustom: true,
    }
    customRecipes.value = [created, ...customRecipes.value]
    void pushToCloud('/api/recipes', 'POST', created as unknown as Record<string, unknown>)
    return created
  }

  function deleteCustomRecipe(recipeId: string) {
    customRecipes.value = customRecipes.value.filter(r => r.id !== recipeId)
    void pushToCloud(`/api/recipes/${encodeURIComponent(recipeId)}`, 'DELETE')
  }

  function hydrateFromCloud(payload: {
    customRecipes?: Recipe[]
    preferences?: Record<string, unknown>
  }) {
    if (Array.isArray(payload.customRecipes)) {
      customRecipes.value = payload.customRecipes
    }
    const prefs = payload.preferences
    if (!prefs) return
    if (Array.isArray(prefs.fridge_ingredients)) {
      fridgeIngredients.value = prefs.fridge_ingredients as string[]
    }
    if (typeof prefs.cooking_time === 'string') {
      cookingTime.value = prefs.cooking_time as CookingTimeRange
    }
    if (typeof prefs.budget_tier === 'string') {
      budget.value = prefs.budget_tier as BudgetTier
    }
    if (typeof prefs.only_exact_fridge_mode === 'boolean') {
      onlyExactFridgeMode.value = prefs.only_exact_fridge_mode
    }
    if (prefs.selected_recipe_ids && typeof prefs.selected_recipe_ids === 'object') {
      selectedRecipeIds.value = prefs.selected_recipe_ids as Record<MealSlot, string>
    }
    if (prefs.checked_shopping_items && typeof prefs.checked_shopping_items === 'object') {
      checkedShoppingItems.value = prefs.checked_shopping_items as Record<string, boolean>
    }
  }

  return {
    fridgeIngredients,
    cookingTime,
    budget,
    selectedRecipeIds,
    checkedShoppingItems,
    customRecipes,
    onlyExactFridgeMode,
    addIngredient,
    removeIngredient,
    clearIngredients,
    setSelectedRecipe,
    setAllSelectedRecipes,
    toggleShoppingItem,
    isShoppingItemChecked,
    clearCheckedShopping,
    addCustomRecipe,
    deleteCustomRecipe,
    hydrateFromCloud,
  }
})
