import type { RowDataPacket } from 'mysql2/promise'
import { ensureTiDBSchema, isTiDBConfigured, parseJsonField } from '../utils/db'

interface RecipeRow extends RowDataPacket {
  id: string
  name: string
  slot: 'sarapan' | 'siang' | 'malam'
  cooking_time: 'under-15' | '15-30' | 'over-30'
  cooking_minutes: number
  budget: 'hemat' | 'standar' | 'spesial'
  estimated_cost: number
  servings: string | null
  summary: string
  tips: string
  tags: unknown
  ingredients: unknown
  steps: unknown
  is_custom: number
}

interface ChoreRow extends RowDataPacket {
  id: string
  title: string
  category: 'rumah' | 'dapur' | 'kendaraan' | 'tanaman' | 'lainnya'
  interval_days: number
  last_done_at: string
  notes: string | null
}

interface JajanRow extends RowDataPacket {
  id: string
  amount: number
  label: string
  raw_input: string
  expense_date: string
  created_at: string
}

interface PrefRow extends RowDataPacket {
  pref_key: string
  pref_value: unknown
}

export default defineEventHandler(async () => {
  if (!isTiDBConfigured()) {
    return { connected: false }
  }

  const db = await ensureTiDBSchema()

  const [[recipeRows], [choreRows], [jajanRows], [prefRows]] = await Promise.all([
    db.query<RecipeRow[]>('SELECT * FROM recipes WHERE is_custom = 1 ORDER BY created_at DESC'),
    db.query<ChoreRow[]>('SELECT * FROM chores ORDER BY created_at DESC'),
    db.query<JajanRow[]>('SELECT * FROM jajan_expenses ORDER BY created_at DESC'),
    db.query<PrefRow[]>('SELECT pref_key, pref_value FROM app_preferences'),
  ])

  const preferences: Record<string, unknown> = {}
  for (const row of prefRows) {
    preferences[row.pref_key] = parseJsonField(row.pref_value, null)
  }

  const customRecipes = recipeRows.map(row => ({
    id: row.id,
    name: row.name,
    slot: row.slot,
    cookingTime: row.cooking_time,
    cookingMinutes: Number(row.cooking_minutes),
    budget: row.budget,
    estimatedCost: Number(row.estimated_cost),
    servings: row.servings || undefined,
    summary: row.summary,
    tips: row.tips,
    tags: parseJsonField<string[]>(row.tags, []),
    ingredients: parseJsonField(row.ingredients, []),
    steps: parseJsonField<string[]>(row.steps, []),
    isCustom: Boolean(row.is_custom),
  }))

  const chores = choreRows.map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    intervalDays: Number(row.interval_days),
    lastDoneAt: row.last_done_at,
    notes: row.notes || undefined,
  }))

  const expenses = jajanRows.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    label: row.label,
    rawInput: row.raw_input,
    date: row.expense_date,
    createdAt: row.created_at,
  }))

  return {
    connected: true,
    customRecipes,
    chores,
    expenses,
    preferences,
  }
})
