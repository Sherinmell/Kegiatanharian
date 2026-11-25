const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const
const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const
const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

/**
 * Format angka ke format Rupiah Indonesia secara deterministik (aman untuk SSR & hydration).
 */
export function formatRupiah(amount: number, withPrefix = true): string {
  const isNegative = amount < 0
  const absRounded = Math.round(Math.abs(amount))
  const formatted = absRounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const prefix = withPrefix ? 'Rp' : ''
  return `${isNegative ? '-' : ''}${prefix}${formatted}`
}

/**
 * Format ringkas untuk badge atau angka besar, misal 25rb, 1,5jt.
 */
export function formatRupiahShort(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1).replace('.', ',')
    return `${sign}Rp${val}jt`
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1).replace('.', ',')
    return `${sign}Rp${val}rb`
  }
  return `${sign}Rp${Math.round(abs)}`
}

/**
 * Mengembalikan tanggal lokal dalam format YYYY-MM-DD.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Mengembalikan YYYY-MM-DD untuk n hari sebelum/sesudah hari ini.
 */
export function offsetDateKey(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  d.setDate(d.getDate() + daysOffset)
  return getLocalDateKey(d)
}

/**
 * Parse YYYY-MM-DD ke Date lokal pukul 00:00:00.
 */
export function parseDateKey(dateKey: string): Date {
  const [yStr, mStr, dStr] = dateKey.split('-')
  const y = Number(yStr) || new Date().getFullYear()
  const m = (Number(mStr) || 1) - 1
  const d = Number(dStr) || 1
  return new Date(y, m, d)
}

/**
 * Selisih hari bulat antara dateA - dateB (berdasarkan tanggal kalender lokal).
 */
export function diffDays(dateKeyA: string, dateKeyB: string): number {
  const a = parseDateKey(dateKeyA)
  const b = parseDateKey(dateKeyB)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcA - utcB) / 86_400_000)
}

export function formatTanggalLengkap(date: Date = new Date()): string {
  return `${DAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`
}

export function formatTanggalPendek(dateKey: string): string {
  const d = parseDateKey(dateKey)
  return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]}`
}

export function getGreetingID(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour >= 4 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function getMonthNameID(date: Date = new Date()): string {
  return `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`
}
