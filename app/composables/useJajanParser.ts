import { computed } from 'vue'
import { useJajanStore } from '~/stores/jajan'
import type { ParsedJajanResult } from '~/types'
import { getDaysInMonth, getLocalDateKey, getMonthNameID } from '~/utils/format'

const AMOUNT_TOKEN_REGEX = /(?:^|\s)(?:rp\.?\s*)?(\d+(?:[.,]\d+)?(?:\.\d{3})*)\s*(jt|juta|rb|ribu|k)?(?=\s|$)/i

function parseRawNumber(numStr: string, unitRaw?: string): number {
  const unit = unitRaw?.toLowerCase()

  if (unit === 'jt' || unit === 'juta') {
    const normalized = Number(numStr.replace(',', '.'))
    return Number.isFinite(normalized) ? Math.round(normalized * 1_000_000) : NaN
  }

  if (unit === 'rb' || unit === 'ribu' || unit === 'k') {
    const normalized = Number(numStr.replace(',', '.'))
    return Number.isFinite(normalized) ? Math.round(normalized * 1_000) : NaN
  }

  // Tanpa satuan: cek apakah pakai pemisah ribuan titik/koma seperti 15.000 atau 1.500.000
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(numStr)) {
    const stripped = numStr.replace(/[.,]/g, '')
    return Number(stripped)
  }

  const fallback = Number(numStr.replace(',', '.'))
  return Number.isFinite(fallback) ? Math.round(fallback) : NaN
}

function capitalizeLabel(text: string): string {
  const cleaned = text.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '').replace(/\s+/g, ' ')
  if (!cleaned) return 'Jajan'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Mem-parse input natural berbahasa Indonesia seperti:
 * "25rb kopi", "15000 parkir", "12.5k gorengan", "50rb makan siang", "kopi susu 22rb", "Rp 35.000 bakso".
 */
export function parseJajanInput(rawInput: string): ParsedJajanResult {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return { valid: false, amount: 0, label: '', error: 'Ketik nominal dan keterangan, misal: 25rb kopi' }
  }

  const match = trimmed.match(AMOUNT_TOKEN_REGEX)
  if (!match || !match[1]) {
    return {
      valid: false,
      amount: 0,
      label: trimmed,
      error: 'Nominal belum terdeteksi. Contoh: "25rb kopi" atau "15000 parkir"',
    }
  }

  const amount = parseRawNumber(match[1], match[2])
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      valid: false,
      amount: 0,
      label: '',
      error: 'Nominal harus lebih dari Rp0',
    }
  }

  const matchedText = match[0]
  const matchIndex = match.index ?? 0
  const before = trimmed.slice(0, matchIndex)
  const after = trimmed.slice(matchIndex + matchedText.length)
  const label = capitalizeLabel(`${before} ${after}`)

  return {
    valid: true,
    amount,
    label,
  }
}

export const QUICK_JAJAN_PRESETS = [
  '5rb parkir',
  '15rb kopi',
  '12.5k gorengan',
  '25rb makan siang',
  '10rb es teh & camilan',
] as const

export function useJajanParser() {
  const store = useJajanStore()

  const now = new Date()
  const todayKey = computed(() => getLocalDateKey())
  const currentMonthPrefix = computed(() => todayKey.value.slice(0, 7))
  const currentMonthLabel = computed(() => getMonthNameID(now))
  const daysInMonth = computed(() => getDaysInMonth(now))
  const currentDayOfMonth = computed(() => new Date().getDate())
  const remainingDaysInMonth = computed(() =>
    Math.max(1, daysInMonth.value - currentDayOfMonth.value + 1),
  )

  const monthExpenses = computed(() =>
    store.expenses.filter(item => item.date.startsWith(currentMonthPrefix.value)),
  )

  const todayExpenses = computed(() =>
    monthExpenses.value.filter(item => item.date === todayKey.value),
  )

  const earlierMonthExpenses = computed(() =>
    monthExpenses.value.filter(item => item.date !== todayKey.value),
  )

  const spentThisMonth = computed(() =>
    monthExpenses.value.reduce((sum, item) => sum + item.amount, 0),
  )

  const spentToday = computed(() =>
    todayExpenses.value.reduce((sum, item) => sum + item.amount, 0),
  )

  const spentBeforeToday = computed(() =>
    Math.max(0, spentThisMonth.value - spentToday.value),
  )

  const remainingMonthlyBudget = computed(() =>
    store.monthlyBudget - spentThisMonth.value,
  )

  // Sisa bujet bulan ini (sebelum jajan hari ini) dibagi sisa hari di bulan berjalan
  const dailyAllowanceStart = computed(() => {
    const budgetAtStartOfDay = store.monthlyBudget - spentBeforeToday.value
    if (budgetAtStartOfDay <= 0) return 0
    return Math.floor(budgetAtStartOfDay / remainingDaysInMonth.value)
  })

  // Sisa jatah aman hari ini yang berkurang real-time setiap kali jajan dicatat
  const remainingTodayAllowance = computed(() =>
    dailyAllowanceStart.value - spentToday.value,
  )

  // Proyeksi jatah harian baru jika dihitung dari sisa bujet saat ini dibagi sisa hari
  const currentDailyAverage = computed(() => {
    if (remainingMonthlyBudget.value <= 0) return 0
    return Math.floor(remainingMonthlyBudget.value / remainingDaysInMonth.value)
  })

  const isOverDailyLimit = computed(() =>
    spentToday.value > dailyAllowanceStart.value || remainingTodayAllowance.value < 0,
  )

  const isNearDailyLimit = computed(() => {
    if (isOverDailyLimit.value || dailyAllowanceStart.value <= 0) return false
    return remainingTodayAllowance.value / dailyAllowanceStart.value <= 0.25
  })

  const todayUsagePercent = computed(() => {
    if (dailyAllowanceStart.value <= 0) {
      return spentToday.value > 0 ? 100 : 0
    }
    return Math.min(100, Math.round((spentToday.value / dailyAllowanceStart.value) * 100))
  })

  const monthlyUsagePercent = computed(() => {
    if (store.monthlyBudget <= 0) return spentThisMonth.value > 0 ? 100 : 0
    return Math.min(100, Math.round((spentThisMonth.value / store.monthlyBudget) * 100))
  })

  function submitQuickInput(raw: string) {
    const parsed = parseJajanInput(raw)
    if (!parsed.valid) {
      return { success: false as const, error: parsed.error || 'Format tidak valid' }
    }
    const created = store.addExpense({
      amount: parsed.amount,
      label: parsed.label,
      rawInput: raw,
    })
    return { success: true as const, expense: created }
  }

  return {
    store,
    parseJajanInput,
    todayKey,
    currentMonthLabel,
    daysInMonth,
    currentDayOfMonth,
    remainingDaysInMonth,
    monthExpenses,
    todayExpenses,
    earlierMonthExpenses,
    spentThisMonth,
    spentToday,
    remainingMonthlyBudget,
    dailyAllowanceStart,
    remainingTodayAllowance,
    currentDailyAverage,
    isOverDailyLimit,
    isNearDailyLimit,
    todayUsagePercent,
    monthlyUsagePercent,
    submitQuickInput,
  }
}
