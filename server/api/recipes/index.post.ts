import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const r = await readBody<any>(event)
  if (!r?.id || !r?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Data resep tidak lengkap' })
  }

  const db = await ensureTiDBSchema()
  await db.execute(
    `
    INSERT INTO recipes
      (id, name, slot, cooking_time, cooking_minutes, budget, estimated_cost, servings, summary, tips, tags, ingredients, steps, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      slot = VALUES(slot),
      cooking_time = VALUES(cooking_time),
      cooking_minutes = VALUES(cooking_minutes),
      budget = VALUES(budget),
      estimated_cost = VALUES(estimated_cost),
      servings = VALUES(servings),
      summary = VALUES(summary),
      tips = VALUES(tips),
      tags = VALUES(tags),
      ingredients = VALUES(ingredients),
      steps = VALUES(steps)
    `,
    [
      r.id,
      r.name,
      r.slot,
      r.cookingTime,
      Number(r.cookingMinutes) || 20,
      r.budget,
      Number(r.estimatedCost) || 0,
      r.servings || '2 porsi',
      r.summary || '',
      r.tips || '',
      JSON.stringify(r.tags || []),
      JSON.stringify(r.ingredients || []),
      JSON.stringify(r.steps || []),
    ],
  )

  return { ok: true, id: r.id }
})
