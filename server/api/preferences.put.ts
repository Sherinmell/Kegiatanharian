import { ensureTiDBSchema, isTiDBConfigured } from '../utils/db'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) return { ok: false, skipped: true }

  const body = await readBody<{ key: string; value: unknown }>(event)
  if (!body?.key) {
    throw createError({ statusCode: 400, statusMessage: 'Preference key wajib diisi' })
  }

  const db = await ensureTiDBSchema()
  await db.execute(
    `
    INSERT INTO app_preferences (pref_key, pref_value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value)
    `,
    [body.key, JSON.stringify(body.value ?? null)],
  )

  return { ok: true }
})
