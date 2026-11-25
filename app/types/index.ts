export type MealSlot = 'sarapan' | 'siang' | 'malam'

export type CookingTimeRange = 'all' | 'under-15' | '15-30' | 'over-30'

export type BudgetTier = 'all' | 'hemat' | 'standar' | 'spesial'

export interface RecipeIngredient {
  name: string
  key: string
  measure: string
  isPantryStaple?: boolean
}

export interface Recipe {
  id: string
  name: string
  slot: MealSlot
  cookingTime: Exclude<CookingTimeRange, 'all'>
  cookingMinutes: number
  budget: Exclude<BudgetTier, 'all'>
  estimatedCost: number
  servings?: string
  summary: string
  tips: string
  tags: string[]
  ingredients: RecipeIngredient[]
  steps: string[]
  isCustom?: boolean
}

export interface GeneratedMealEntry {
  slot: MealSlot
  recipe: Recipe
  matchedIngredients: RecipeIngredient[]
  missingIngredients: RecipeIngredient[]
  missingMainIngredients: RecipeIngredient[]
  isExactMatch: boolean
  matchScore: number
}

export type ChoreCategory = 'rumah' | 'dapur' | 'kendaraan' | 'tanaman' | 'lainnya'

export type ChoreStatus = 'safe' | 'warning' | 'urgent'

export interface ChoreItem {
  id: string
  title: string
  category: ChoreCategory
  intervalDays: number
  lastDoneAt: string // YYYY-MM-DD
  notes?: string
}

export interface ChoreComputed extends ChoreItem {
  daysElapsed: number
  daysRemaining: number
  remainingPercent: number
  progressWidth: number
  nextDueDate: string // YYYY-MM-DD
  status: ChoreStatus
  statusText: string
}

export interface JajanExpense {
  id: string
  amount: number
  label: string
  rawInput: string
  date: string // YYYY-MM-DD
  createdAt: string // ISO string
}

export interface ParsedJajanResult {
  valid: boolean
  amount: number
  label: string
  error?: string
}
