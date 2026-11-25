import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const body = await readBody<any>(event)
  if (!body?.id || !body?.title) {
    throw createError({ statusCode: 400, statusMessage: 'Data tugas tidak lengkap' })
  }

  const db = await ensureTiDBSchema()
  await db.execute(
    `
    INSERT INTO chores (id, title, category, interval_days, last_done_at, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      category = VALUES(category),
      interval_days = VALUES(interval_days),
      last_done_at = VALUES(last_done_at),
      notes = VALUES(notes)
    `,
    [
      body.id,
      body.title,
      body.category || 'rumah',
      Number(body.intervalDays) || 7,
      body.lastDoneAt,
      body.notes || null,
    ],
  )

  return { ok: true, id: body.id }
})
