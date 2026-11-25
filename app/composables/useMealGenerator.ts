import { computed, ref } from 'vue'
import { POPULAR_INGREDIENTS, RECIPES_DB } from '~/data/recipes'
import { useJajanParser } from '~/composables/useJajanParser'
import { useMealStore } from '~/stores/meal'
import type {
  BudgetTier,
  CookingTimeRange,
  GeneratedMealEntry,
  MealSlot,
  Recipe,
  RecipeIngredient,
} from '~/types'

const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  telur: ['telor', 'telur ayam', 'telur rebus'],
  kubis: ['kol'],
  sawi: ['pakcoy', 'pokcoy', 'caisim', 'sawi hijau', 'sawi putih'],
  mie: ['mi', 'indomie', 'bihun', 'soun', 'kwetiau', 'mie telur', 'mie instan'],
  nasi: ['beras', 'nasi putih'],
  daging: ['sapi', 'beef', 'daging sapi'],
  ikan: ['kembung', 'nila', 'lele', 'tongkol', 'tuna'],
  cabai: ['cabe', 'rawit', 'cabai merah', 'cabai rawit'],
  ayam: ['dada ayam', 'paha ayam', 'fillet ayam'],
  tahu: ['tahu putih', 'tahu kuning', 'tahu sutra'],
  bawang: ['bawang putih', 'bawang merah', 'bombai', 'bawang bombai'],
  tauge: ['toge', 'kecambah'],
  mentega: ['margarin', 'butter'],
}

export const MEAL_SLOTS: { key: MealSlot; label: string; timeHint: string }[] = [
  { key: 'sarapan', label: 'Sarapan', timeHint: '06.00 – 09.00' },
  { key: 'siang', label: 'Makan Siang', timeHint: '12.00 – 14.00' },
  { key: 'malam', label: 'Makan Malam', timeHint: '18.30 – 20.30' },
]

export const TIME_OPTIONS: { value: CookingTimeRange; label: string; short: string }[] = [
  { value: 'all', label: 'Semua Waktu', short: 'Semua' },
  { value: 'under-15', label: '< 15 menit', short: '< 15 mnt' },
  { value: '15-30', label: '15–30 menit', short: '15–30 mnt' },
  { value: 'over-30', label: '> 30 menit', short: '> 30 mnt' },
]

export const BUDGET_OPTIONS: { value: BudgetTier; label: string; desc: string }[] = [
  { value: 'all', label: 'Semua Bujet', desc: 'Fleksibel' },
  { value: 'hemat', label: 'Hemat / Anak Kos', desc: '< Rp20rb' },
  { value: 'standar', label: 'Standar Keluarga', desc: 'Rp20rb–35rb' },
  { value: 'spesial', label: 'Spesial', desc: '> Rp35rb' },
]

function normalizeToken(value: string): string {
  return value.trim().toLowerCase()
}

function expandFridgeTokens(fridgeIngredients: string[]): Set<string> {
  const tokens = new Set<string>()
  for (const raw of fridgeIngredients) {
    const clean = normalizeToken(raw)
    if (!clean) continue
    tokens.add(clean)
    for (const [canonical, aliases] of Object.entries(INGREDIENT_SYNONYMS)) {
      if (clean === canonical || aliases.some(a => clean.includes(a) || a.includes(clean))) {
        tokens.add(canonical)
        for (const a of aliases) tokens.add(a)
      }
    }
  }
  return tokens
}

function isIngredientAvailable(ingredient: RecipeIngredient, expandedFridge: Set<string>): boolean {
  const key = normalizeToken(ingredient.key)
  const name = normalizeToken(ingredient.name)
  if (expandedFridge.has(key) || expandedFridge.has(name)) return true
  for (const token of expandedFridge) {
    if (token.length >= 3 && (key.includes(token) || name.includes(token) || token.includes(key))) {
      return true
    }
  }
  return false
}

export function useMealGenerator() {
  const store = useMealStore()
  const jajan = useJajanParser()

  const allRecipes = computed<Recipe[]>(() => [
    ...store.customRecipes,
    ...RECIPES_DB,
  ])

  const expandedFridgeTokens = computed(() => expandFridgeTokens(store.fridgeIngredients))

  function evaluateRecipe(recipe: Recipe): {
    matched: RecipeIngredient[]
    missing: RecipeIngredient[]
    missingMain: RecipeIngredient[]
    isExactMatch: boolean
    score: number
  } {
    const matched: RecipeIngredient[] = []
    const missing: RecipeIngredient[] = []

    for (const ing of recipe.ingredients) {
      if (isIngredientAvailable(ing, expandedFridgeTokens.value)) {
        matched.push(ing)
      } else {
        missing.push(ing)
      }
    }

    const mainIngredients = recipe.ingredients.filter(ing => !ing.isPantryStaple)
    const missingMain = missing.filter(ing => !ing.isPantryStaple)
    const matchedMainCount = mainIngredients.length - missingMain.length

    // 100% bisa dimasak tanpa tambahan bahan utama lain (cukup bahan kulkas + bumbu dasar dapur)
    const isExactMatch = matchedMainCount > 0 && missingMain.length === 0

    let score = matched.length * 28
    if (mainIngredients.length > 0) {
      score += Math.round((matchedMainCount / mainIngredients.length) * 35)
    }

    // Bonus besar untuk resep yang bisa langsung dimasak tanpa belanja bahan tambahan
    if (isExactMatch) {
      score += store.onlyExactFridgeMode ? 120 : 45
    } else if (store.onlyExactFridgeMode && store.fridgeIngredients.length > 0) {
      score -= missingMain.length * 30
    }

    if (store.cookingTime !== 'all') {
      score += recipe.cookingTime === store.cookingTime ? 28 : -18
    }

    if (store.budget !== 'all') {
      score += recipe.budget === store.budget ? 28 : -18
    }

    return { matched, missing, missingMain, isExactMatch, score }
  }

  function toEntry(recipe: Recipe, overrideSlot?: MealSlot): GeneratedMealEntry {
    const { matched, missing, missingMain, isExactMatch, score } = evaluateRecipe(recipe)
    return {
      slot: overrideSlot ?? recipe.slot,
      recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      missingMainIngredients: missingMain,
      isExactMatch,
      matchScore: score,
    }
  }

  function getRankedRecipesForSlot(slot: MealSlot) {
    return allRecipes.value
      .filter(r => r.slot === slot)
      .map(recipe => toEntry(recipe))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        if (a.isExactMatch !== b.isExactMatch) return a.isExactMatch ? -1 : 1
        return b.matchedIngredients.length - a.matchedIngredients.length
      })
  }

  function generateSmartMeals() {
    const nextSelection = { ...store.selectedRecipeIds }
    for (const slot of ['sarapan', 'siang', 'malam'] as MealSlot[]) {
      const ranked = getRankedRecipesForSlot(slot)
      if (ranked[0]) {
        nextSelection[slot] = ranked[0].recipe.id
      }
    }
    store.setAllSelectedRecipes(nextSelection)
  }

  function shuffleSlot(slot: MealSlot) {
    const ranked = getRankedRecipesForSlot(slot)
    if (ranked.length === 0) return

    const currentId = store.selectedRecipeIds[slot]
    const exactPool = store.onlyExactFridgeMode
      ? ranked.filter(item => item.isExactMatch)
      : []

    const filtered = (exactPool.length > 0 ? exactPool : ranked).filter((item) => {
      const timeOk = store.cookingTime === 'all' || item.recipe.cookingTime === store.cookingTime
      const budgetOk = store.budget === 'all' || item.recipe.budget === store.budget
      return timeOk && budgetOk
    })

    const poolBase = filtered.length >= 2
      ? filtered
      : exactPool.length > 0
        ? exactPool
        : ranked.slice(0, Math.min(6, ranked.length))

    const pool = poolBase.filter(item => item.recipe.id !== currentId)
    const candidates = pool.length > 0 ? pool : poolBase
    const picked = candidates[Math.floor(Math.random() * candidates.length)]

    if (picked) {
      store.setSelectedRecipe(slot, picked.recipe.id)
    }
  }

  function shuffleAllMeals() {
    for (const slot of ['sarapan', 'siang', 'malam'] as MealSlot[]) {
      shuffleSlot(slot)
    }
  }

  function selectRecipeForSlot(recipe: Recipe, targetSlot?: MealSlot) {
    store.setSelectedRecipe(targetSlot ?? recipe.slot, recipe.id)
  }

  function getSelectedSlotForRecipe(recipeId: string): MealSlot | null {
    for (const slot of ['sarapan', 'siang', 'malam'] as MealSlot[]) {
      if (store.selectedRecipeIds[slot] === recipeId) return slot
    }
    return null
  }

  const dailyMeals = computed<GeneratedMealEntry[]>(() => {
    return (['sarapan', 'siang', 'malam'] as MealSlot[]).map((slot) => {
      const selectedId = store.selectedRecipeIds[slot]
      const fallback = allRecipes.value.find(r => r.slot === slot) || RECIPES_DB[0]!
      const recipe = allRecipes.value.find(r => r.id === selectedId) || fallback
      return toEntry(recipe, slot)
    })
  })

  // Semua resep yang 100% bisa langsung dimasak hanya dari bahan di kulkas (tanpa tambahan bahan utama lain)
  const exactMatchRecipes = computed<GeneratedMealEntry[]>(() => {
    if (store.fridgeIngredients.length === 0) return []
    return allRecipes.value
      .map(recipe => toEntry(recipe))
      .filter(entry => entry.isExactMatch)
      .sort((a, b) => {
        if (b.matchedIngredients.length !== a.matchedIngredients.length) {
          return b.matchedIngredients.length - a.matchedIngredients.length
        }
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        return a.recipe.cookingMinutes - b.recipe.cookingMinutes
      })
  })

  // Semua rekomendasi menu lainnya sesuai bahan kulkas & filter
  const otherRecommendations = computed<GeneratedMealEntry[]>(() => {
    const selectedSet = new Set(dailyMeals.value.map(entry => entry.recipe.id))

    return allRecipes.value
      .filter(recipe => !selectedSet.has(recipe.id))
      .map(recipe => toEntry(recipe))
      .sort((a, b) => {
        if (a.isExactMatch !== b.isExactMatch) return a.isExactMatch ? -1 : 1
        if (b.matchedIngredients.length !== a.matchedIngredients.length) {
          return b.matchedIngredients.length - a.matchedIngredients.length
        }
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        return a.recipe.cookingMinutes - b.recipe.cookingMinutes
      })
  })

  const totalEstimatedCost = computed(() =>
    dailyMeals.value.reduce((sum, entry) => sum + entry.recipe.estimatedCost, 0),
  )

  // Target bujet makan hari ini berdasarkan sisa uang bulanan dibagi sisa hari (dan sisa jatah hari ini)
  const dailyMoneyTarget = computed(() => Math.max(0, jajan.dailyAllowanceStart.value))
  const remainingMoneyToday = computed(() => Math.max(0, jajan.remainingTodayAllowance.value))
  const budgetComboSeed = ref(0)

  function shuffleBudgetCombo() {
    budgetComboSeed.value += 1
  }

  // Hasilkan 3 variasi paket 3x makan (Sarapan + Makan Siang + Makan Malam) sesuai uang bulanan
  const budgetMealPackages = computed(() => {
    const seed = budgetComboSeed.value
    const target = remainingMoneyToday.value > 0 ? remainingMoneyToday.value : dailyMoneyTarget.value
    const bySlot = {
      sarapan: getRankedRecipesForSlot('sarapan'),
      siang: getRankedRecipesForSlot('siang'),
      malam: getRankedRecipesForSlot('malam'),
    }

    const pickCandidates = (list: GeneratedMealEntry[]) => {
      const byScore = list.slice(0, 8)
      const byCheap = [...list].sort((a, b) => a.recipe.estimatedCost - b.recipe.estimatedCost).slice(0, 8)
      const map = new Map<string, GeneratedMealEntry>()
      for (const item of [...byScore, ...byCheap]) {
        map.set(item.recipe.id, item)
      }
      return Array.from(map.values())
    }

    const sarapanList = pickCandidates(bySlot.sarapan)
    const siangList = pickCandidates(bySlot.siang)
    const malamList = pickCandidates(bySlot.malam)

    interface CandidateCombo {
      meals: [GeneratedMealEntry, GeneratedMealEntry, GeneratedMealEntry]
      totalCost: number
      quality: number
      comboKey: string
    }

    const allCombos: CandidateCombo[] = []

    for (const s of sarapanList) {
      for (const l of siangList) {
        for (const d of malamList) {
          const totalCost = s.recipe.estimatedCost + l.recipe.estimatedCost + d.recipe.estimatedCost
          const baseQuality = s.matchScore + l.matchScore + d.matchScore
          const budgetBonus = target > 0 && totalCost <= target
            ? 60 + Math.min(25, Math.round((totalCost / target) * 20))
            : -Math.round(Math.max(0, totalCost - target) / 1000)

          allCombos.push({
            meals: [s, l, d],
            totalCost,
            quality: baseQuality + budgetBonus,
            comboKey: `${s.recipe.id}|${l.recipe.id}|${d.recipe.id}`,
          })
        }
      }
    }

    if (allCombos.length === 0) return []

    const withinBudget = target > 0
      ? allCombos.filter(c => c.totalCost <= target)
      : []

    const poolForBest = withinBudget.length > 0 ? withinBudget : allCombos

    // 1. Paket Paling Pas (terbaik sesuai bahan kulkas + uang harian)
    const sortedBest = [...poolForBest].sort((a, b) => b.quality - a.quality)
    const bestPkg = sortedBest[0]!

    // 2. Paket Super Hemat (termurah untuk sisa uang maksimal)
    const sortedCheapest = [...allCombos].sort((a, b) => {
      if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost
      return b.quality - a.quality
    })
    const cheapestPkg = sortedCheapest.find(c => c.comboKey !== bestPkg.comboKey) ?? sortedCheapest[0]!

    // 3. Paket Variasi (bisa diacak ulang dengan tombol Acak Paket)
    const altPool = sortedBest.filter(
      c => c.comboKey !== bestPkg.comboKey && c.comboKey !== cheapestPkg.comboKey,
    )
    const variantPool = altPool.length > 0 ? altPool.slice(0, 24) : sortedBest.slice(0, 12)
    const variantPkg = variantPool[(seed * 5 + 1) % variantPool.length] ?? bestPkg

    const formatPkg = (id: 'pas' | 'hemat' | 'variasi', title: string, subtitle: string, combo: CandidateCombo) => ({
      id,
      title,
      subtitle,
      meals: combo.meals,
      totalCost: combo.totalCost,
      targetBudget: target,
      fitsRemainingToday: remainingMoneyToday.value > 0 && combo.totalCost <= remainingMoneyToday.value,
      fitsDailyAllowance: dailyMoneyTarget.value > 0 && combo.totalCost <= dailyMoneyTarget.value,
      leftoverAfterMeals: target - combo.totalCost,
    })

    return [
      formatPkg('pas', 'Paket Paling Pas', 'Cocok bahan kulkas & masuk jatah harian', bestPkg),
      formatPkg('hemat', 'Paket Super Hemat', 'Biaya paling minim, sisa uang lebih banyak', cheapestPkg),
      formatPkg('variasi', 'Paket Variasi', 'Pilihan 3x makan lain sesuai jatahmu', variantPkg),
    ]
  })

  const budgetMealCombo = computed(() => budgetMealPackages.value[0] ?? null)

  // Daftar rekomendasi makanan satuan yang harganya masuk sisa uang hari ini
  const budgetFriendlyRecipes = computed<GeneratedMealEntry[]>(() => {
    const cap = remainingMoneyToday.value > 0 ? remainingMoneyToday.value : dailyMoneyTarget.value
    if (cap <= 0) return []

    return allRecipes.value
      .map(recipe => toEntry(recipe))
      .filter(entry => entry.recipe.estimatedCost <= cap)
      .sort((a, b) => {
        if (a.isExactMatch !== b.isExactMatch) return a.isExactMatch ? -1 : 1
        if (b.matchedIngredients.length !== a.matchedIngredients.length) {
          return b.matchedIngredients.length - a.matchedIngredients.length
        }
        return a.recipe.estimatedCost - b.recipe.estimatedCost
      })
  })

  const isCurrentPlanWithinDailyBudget = computed(() =>
    dailyMoneyTarget.value > 0 && totalEstimatedCost.value <= dailyMoneyTarget.value,
  )

  const isCurrentPlanWithinRemainingToday = computed(() =>
    remainingMoneyToday.value > 0 && totalEstimatedCost.value <= remainingMoneyToday.value,
  )

  function applyBudgetMealPlan(meals?: [GeneratedMealEntry, GeneratedMealEntry, GeneratedMealEntry]) {
    const targetMeals = meals ?? budgetMealCombo.value?.meals
    if (!targetMeals) return false
    store.setAllSelectedRecipes({
      sarapan: targetMeals[0].recipe.id,
      siang: targetMeals[1].recipe.id,
      malam: targetMeals[2].recipe.id,
    })
    return true
  }

  const aggregatedShoppingList = computed(() => {
    const map = new Map<
      string,
      {
        id: string
        name: string
        measure: string
        slots: MealSlot[]
        isPantryStaple: boolean
        checked: boolean
      }
    >()

    for (const entry of dailyMeals.value) {
      for (const ing of entry.missingIngredients) {
        const itemId = `${entry.recipe.id}::${ing.key}`
        map.set(itemId, {
          id: itemId,
          name: ing.name,
          measure: ing.measure,
          slots: [entry.slot],
          isPantryStaple: Boolean(ing.isPantryStaple),
          checked: store.isShoppingItemChecked(itemId),
        })
      }
    }

    return Array.from(map.values())
  })

  const uncheckedShoppingCount = computed(() =>
    aggregatedShoppingList.value.filter(item => !item.checked && !item.isPantryStaple).length,
  )

  const totalRecipeCount = computed(() => allRecipes.value.length)

  const suggestedIngredients = computed(() =>
    POPULAR_INGREDIENTS.filter(item => !store.fridgeIngredients.includes(item)),
  )

  function getShoppingItemKey(recipeId: string, ingredientKey: string): string {
    return `${recipeId}::${ingredientKey}`
  }

  return {
    store,
    allRecipes,
    dailyMeals,
    exactMatchRecipes,
    otherRecommendations,
    totalEstimatedCost,
    dailyMoneyTarget,
    remainingMoneyToday,
    budgetMealPackages,
    budgetMealCombo,
    shuffleBudgetCombo,
    budgetFriendlyRecipes,
    isCurrentPlanWithinDailyBudget,
    isCurrentPlanWithinRemainingToday,
    applyBudgetMealPlan,
    aggregatedShoppingList,
    uncheckedShoppingCount,
    totalRecipeCount,
    suggestedIngredients,
    generateSmartMeals,
    shuffleSlot,
    shuffleAllMeals,
    selectRecipeForSlot,
    getSelectedSlotForRecipe,
    getShoppingItemKey,
  }
}
