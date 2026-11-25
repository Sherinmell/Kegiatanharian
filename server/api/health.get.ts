import type { RowDataPacket } from 'mysql2/promise'
import { ensureTiDBSchema, isTiDBConfigured } from '../utils/db'

interface CountRow extends RowDataPacket {
  recipes_count: number
  chores_count: number
  jajan_count: number
  prefs_count: number
}

export default defineEventHandler(async () => {
  if (!isTiDBConfigured()) {
    return { ok: false, configured: false, message: 'TiDB Cloud belum dikonfigurasi' }
  }

  try {
    const db = await ensureTiDBSchema()
    const [rows] = await db.query<CountRow[]>(`
      SELECT
        (SELECT COUNT(*) FROM recipes) AS recipes_count,
        (SELECT COUNT(*) FROM chores) AS chores_count,
        (SELECT COUNT(*) FROM jajan_expenses) AS jajan_count,
        (SELECT COUNT(*) FROM app_preferences) AS prefs_count
    `)

    return {
      ok: true,
      configured: true,
      database: useRuntimeConfig().tidbDatabase || 'harianku',
      counts: rows[0] || null,
    }
  } catch (err: any) {
    return {
      ok: false,
      configured: true,
      message: err?.message || 'Gagal terhubung ke TiDB Cloud',
    }
  }
})
