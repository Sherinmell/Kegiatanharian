import { ensureTiDBSchema, isTiDBConfigured } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID resep wajib diisi' })
  }

  const db = await ensureTiDBSchema()
  await db.execute('DELETE FROM recipes WHERE id = ? AND is_custom = 1', [id])

  return { ok: true }
})
