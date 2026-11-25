import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const id = getRouterParam(event, 'id')
  const body = await readBody<{ lastDoneAt?: string }>(event)
  if (!id || !body?.lastDoneAt) {
    throw createError({ statusCode: 400, statusMessage: 'ID dan lastDoneAt wajib diisi' })
  }

  const db = await ensureTiDBSchema()
  await db.execute('UPDATE chores SET last_done_at = ? WHERE id = ?', [body.lastDoneAt, id])

  return { ok: true }
})
