import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID jajan wajib diisi' })
  }

  const db = await ensureTiDBSchema()
  await db.execute('DELETE FROM jajan_expenses WHERE id = ?', [id])

  return { ok: true }
})
