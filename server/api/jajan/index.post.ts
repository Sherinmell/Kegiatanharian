import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const body = await readBody<any>(event)
  if (!body?.id || !Number.isFinite(Number(body.amount))) {
    throw createError({ statusCode: 400, statusMessage: 'Data jajan tidak lengkap' })
  }

  const db = await ensureTiDBSchema()
  await db.execute(
    `
    INSERT INTO jajan_expenses (id, amount, label, raw_input, expense_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      amount = VALUES(amount),
      label = VALUES(label),
      raw_input = VALUES(raw_input),
      expense_date = VALUES(expense_date)
    `,
    [
      body.id,
      Math.round(Number(body.amount)),
      body.label || 'Jajan',
      body.rawInput || '',
      body.date,
      body.createdAt || new Date().toISOString(),
    ],
  )

  return { ok: true, id: body.id }
})
