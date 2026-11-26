import mysql from 'mysql2/promise'
import type { Pool, RowDataPacket } from 'mysql2/promise'

let pool: Pool | null = null
let schemaReady = false

function getSanitizedDatabaseName(): string {
  const config = useRuntimeConfig()
  const raw = String(config.tidbDatabase || 'harianku')
  return raw.replace(/[^a-zA-Z0-9_]/g, '') || 'harianku'
}

export function isTiDBConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.tidbHost && config.tidbUser && config.tidbPassword)
}

export function getTiDBPool(): Pool {
  if (pool) return pool

  const config = useRuntimeConfig()
  if (!config.tidbHost || !config.tidbUser || !config.tidbPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: 'TiDB Cloud belum dikonfigurasi pada environment variables',
    })
  }

  pool = mysql.createPool({
    host: String(config.tidbHost),
    port: Number(config.tidbPort || 4000),
    user: String(config.tidbUser),
    password: String(config.tidbPassword),
    database: getSanitizedDatabaseName(),
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
  })

  return pool
}

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function offsetDateKey(daysOffset: number, baseDate = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  d.setDate(d.getDate() + daysOffset)
  return getLocalDateKey(d)
}

export async function ensureTiDBSchema(): Promise<Pool> {
  if (schemaReady && pool) return pool

  const config = useRuntimeConfig()
  const dbName = getSanitizedDatabaseName()

  // Pastikan database sudah ada di cluster TiDB Cloud sebelum memakai pool
  const bootstrapConn = await mysql.createConnection({
    host: String(config.tidbHost),
    port: Number(config.tidbPort || 4000),
    user: String(config.tidbUser),
    password: String(config.tidbPassword),
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  })

  try {
    await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
  } finally {
    await bootstrapConn.end()
  }

  const db = getTiDBPool()

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slot VARCHAR(20) NOT NULL,
      cooking_time VARCHAR(20) NOT NULL,
      cooking_minutes INT NOT NULL,
      budget VARCHAR(20) NOT NULL,
      estimated_cost INT NOT NULL,
      servings VARCHAR(50),
      summary TEXT NOT NULL,
      tips TEXT NOT NULL,
      tags JSON NOT NULL,
      ingredients JSON NOT NULL,
      steps JSON NOT NULL,
      is_custom TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS chores (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(30) NOT NULL,
      interval_days INT NOT NULL,
      last_done_at VARCHAR(10) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS jajan_expenses (
      id VARCHAR(100) PRIMARY KEY,
      amount INT NOT NULL,
      label VARCHAR(200) NOT NULL,
      raw_input VARCHAR(255) NOT NULL,
      expense_date VARCHAR(10) NOT NULL,
      created_at VARCHAR(40) NOT NULL
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_preferences (
      pref_key VARCHAR(100) PRIMARY KEY,
      pref_value JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Auto-seed data awal jika tabel baru dibuat & masih kosong
  const [choreCountRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM chores')
  if (Number(choreCountRows[0]?.total || 0) === 0) {
    const initialChores = [
      ['chore-botol-minum', 'Cuci botol minum', 'dapur', 3, offsetDateKey(-4), 'Sikat bagian tutup & karet seal agar tidak bau.'],
      ['chore-kuras-galon', 'Kuras & bersihkan dispenser / galon', 'dapur', 14, offsetDateKey(-13), 'Bilas tangki air hangat & lap bagian keran.'],
      ['chore-siram-tanaman', 'Siram tanaman rumah', 'tanaman', 3, offsetDateKey(-2), 'Siram secukupnya di pagi atau sore hari.'],
      ['chore-ganti-seprai', 'Ganti seprai & sarung bantal', 'rumah', 14, offsetDateKey(-9), 'Cuci dengan air hangat biar bebas tungau.'],
      ['chore-filter-ac', 'Bersihkan filter AC', 'rumah', 30, offsetDateKey(-10), 'Cuci jaring filter dengan air mengalir, keringkan dulu.'],
      ['chore-servis-motor', 'Servis motor / ganti oli', 'kendaraan', 30, offsetDateKey(-8), 'Cek tekanan ban, rem, dan kilometer oli mesin.'],
    ]
    for (const row of initialChores) {
      await db.execute(
        'INSERT IGNORE INTO chores (id, title, category, interval_days, last_done_at, notes) VALUES (?, ?, ?, ?, ?, ?)',
        row,
      )
    }
  }

  const [jajanCountRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM jajan_expenses')
  if (Number(jajanCountRows[0]?.total || 0) === 0) {
    const now = new Date()
    const today = getLocalDateKey(now)
    const dayOfMonth = now.getDate()
    const yesterday = dayOfMonth > 1 ? offsetDateKey(-1, now) : today
    const twoDaysAgo = dayOfMonth > 2 ? offsetDateKey(-2, now) : yesterday
    const initialExpenses = [
      ['jajan-seed-1', 18000, 'Kopi susu es', '18rb kopi susu es', today, new Date(now.getTime() - 1000 * 60 * 95).toISOString()],
      ['jajan-seed-2', 12500, 'Gorengan & teh hangat', '12.5k gorengan & teh hangat', today, new Date(now.getTime() - 1000 * 60 * 35).toISOString()],
      ['jajan-seed-3', 35000, 'Makan siang ayam geprek', '35rb makan siang ayam geprek', yesterday, new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString()],
      ['jajan-seed-4', 5000, 'Parkir minimarket', '5000 parkir minimarket', yesterday, new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString()],
      ['jajan-seed-5', 25000, 'Martabak mini sore', '25rb martabak mini sore', twoDaysAgo, new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString()],
    ]
    for (const row of initialExpenses) {
      await db.execute(
        'INSERT IGNORE INTO jajan_expenses (id, amount, label, raw_input, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        row,
      )
    }
  }

  const [prefCountRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM app_preferences')
  if (Number(prefCountRows[0]?.total || 0) === 0) {
    const defaultPrefs: Record<string, unknown> = {
      monthly_budget: 1500000,
      fridge_ingredients: ['telur', 'tahu', 'sawi'],
      cooking_time: 'all',
      budget_tier: 'all',
      only_exact_fridge_mode: false,
      selected_recipe_ids: {
        sarapan: 'sarapan-nasi-goreng-telur',
        siang: 'siang-sayur-bening-bayam-tempe',
        malam: 'malam-tahu-cabai-garam',
      },
      checked_shopping_items: {},
    }
    for (const [key, value] of Object.entries(defaultPrefs)) {
      await db.execute(
        'INSERT IGNORE INTO app_preferences (pref_key, pref_value) VALUES (?, ?)',
        [key, JSON.stringify(value)],
      )
    }
  }

  schemaReady = true
  return db
}

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}
