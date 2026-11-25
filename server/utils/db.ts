import mysql from 'mysql2/promise'
import type { Pool } from 'mysql2/promise'

let pool: Pool | null = null
let schemaReady = false

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
      statusMessage: 'TiDB Cloud belum dikonfigurasi pada file .env',
    })
  }

  pool = mysql.createPool({
    host: String(config.tidbHost),
    port: Number(config.tidbPort || 4000),
    user: String(config.tidbUser),
    password: String(config.tidbPassword),
    database: String(config.tidbDatabase || 'harianku'),
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

export async function ensureTiDBSchema(): Promise<Pool> {
  const db = getTiDBPool()
  if (schemaReady) return db

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
