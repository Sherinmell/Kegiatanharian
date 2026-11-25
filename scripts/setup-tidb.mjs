import fs from 'node:fs'
import path from 'node:path'
import mysql from 'mysql2/promise'
import { RECIPES_DB } from '../app/data/recipes.ts'

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    const val = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function offsetDateKey(daysOffset, baseDate = new Date()) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  d.setDate(d.getDate() + daysOffset)
  return getLocalDateKey(d)
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), '.env'))

  const host = process.env.TIDB_HOST
  const port = Number(process.env.TIDB_PORT || 4000)
  const user = process.env.TIDB_USER
  const password = process.env.TIDB_PASSWORD
  const database = (process.env.TIDB_DATABASE || 'harianku').replace(/[^a-zA-Z0-9_]/g, '')

  if (!host || !user || !password) {
    console.error('Error: TIDB_HOST, TIDB_USER, dan TIDB_PASSWORD wajib diisi di file .env')
    process.exit(1)
  }

  console.log(`Menghubungkan ke TiDB Cloud (${host}:${port})...`)

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  })

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
    await conn.query(`USE \`${database}\``)
    console.log(`Database '${database}' siap digunakan.`)

    // 1. Tabel recipes
    await conn.query(`
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

    // 2. Tabel chores
    await conn.query(`
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

    // 3. Tabel jajan_expenses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS jajan_expenses (
        id VARCHAR(100) PRIMARY KEY,
        amount INT NOT NULL,
        label VARCHAR(200) NOT NULL,
        raw_input VARCHAR(255) NOT NULL,
        expense_date VARCHAR(10) NOT NULL,
        created_at VARCHAR(40) NOT NULL
      )
    `)

    // 4. Tabel app_preferences
    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_preferences (
        pref_key VARCHAR(100) PRIMARY KEY,
        pref_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log('Semua tabel berhasil dibuat / diverifikasi.')

    // Seed 54 resep bawaan (upsert agar aman dijalankan berulang)
    for (const r of RECIPES_DB) {
      await conn.execute(
        `
        INSERT INTO recipes
          (id, name, slot, cooking_time, cooking_minutes, budget, estimated_cost, servings, summary, tips, tags, ingredients, steps, is_custom)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
          r.cookingMinutes,
          r.budget,
          r.estimatedCost,
          r.servings || '2 porsi',
          r.summary,
          r.tips,
          JSON.stringify(r.tags),
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
        ],
      )
    }

    // Seed chores awal jika tabel masih kosong
    const [choreCountRows] = await conn.query('SELECT COUNT(*) AS total FROM chores')
    if (Number(choreCountRows[0].total) === 0) {
      const initialChores = [
        ['chore-botol-minum', 'Cuci botol minum', 'dapur', 3, offsetDateKey(-4), 'Sikat bagian tutup & karet seal agar tidak bau.'],
        ['chore-kuras-galon', 'Kuras & bersihkan dispenser / galon', 'dapur', 14, offsetDateKey(-13), 'Bilas tangki air hangat & lap bagian keran.'],
        ['chore-siram-tanaman', 'Siram tanaman rumah', 'tanaman', 3, offsetDateKey(-2), 'Siram secukupnya di pagi atau sore hari.'],
        ['chore-ganti-seprai', 'Ganti seprai & sarung bantal', 'rumah', 14, offsetDateKey(-9), 'Cuci dengan air hangat biar bebas tungau.'],
        ['chore-filter-ac', 'Bersihkan filter AC', 'rumah', 30, offsetDateKey(-10), 'Cuci jaring filter dengan air mengalir, keringkan dulu.'],
        ['chore-servis-motor', 'Servis motor / ganti oli', 'kendaraan', 30, offsetDateKey(-8), 'Cek tekanan ban, rem, dan kilometer oli mesin.'],
      ]

      for (const row of initialChores) {
        await conn.execute(
          'INSERT IGNORE INTO chores (id, title, category, interval_days, last_done_at, notes) VALUES (?, ?, ?, ?, ?, ?)',
          row,
        )
      }
    }

    // Seed jajan awal jika tabel masih kosong
    const [jajanCountRows] = await conn.query('SELECT COUNT(*) AS total FROM jajan_expenses')
    if (Number(jajanCountRows[0].total) === 0) {
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
        await conn.execute(
          'INSERT IGNORE INTO jajan_expenses (id, amount, label, raw_input, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          row,
        )
      }
    }

    // Seed default preferences jika belum ada
    const defaultPrefs = {
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
      await conn.execute(
        'INSERT IGNORE INTO app_preferences (pref_key, pref_value) VALUES (?, ?)',
        [key, JSON.stringify(value)],
      )
    }

    // Verifikasi jumlah data
    const [counts] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM recipes) AS recipes_count,
        (SELECT COUNT(*) FROM chores) AS chores_count,
        (SELECT COUNT(*) FROM jajan_expenses) AS jajan_count,
        (SELECT COUNT(*) FROM app_preferences) AS prefs_count
    `)

    console.log('Setup & seed TiDB Cloud berhasil!', counts[0])
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('Gagal setup TiDB Cloud:', err)
  process.exit(1)
})
