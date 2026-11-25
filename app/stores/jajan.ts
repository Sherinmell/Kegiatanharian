import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useCloudSync } from '~/composables/useCloudSync'
import type { JajanExpense } from '~/types'
import { getLocalDateKey, offsetDateKey } from '~/utils/format'

function createInitialExpenses(): JajanExpense[] {
  const now = new Date()
  const today = getLocalDateKey(now)
  const dayOfMonth = now.getDate()
  const yesterday = dayOfMonth > 1 ? offsetDateKey(-1, now) : today
  const twoDaysAgo = dayOfMonth > 2 ? offsetDateKey(-2, now) : yesterday

  return [
    {
      id: 'jajan-seed-1',
      amount: 18000,
      label: 'Kopi susu es',
      rawInput: '18rb kopi susu es',
      date: today,
      createdAt: new Date(now.getTime() - 1000 * 60 * 95).toISOString(),
    },
    {
      id: 'jajan-seed-2',
      amount: 12500,
      label: 'Gorengan & teh hangat',
      rawInput: '12.5k gorengan & teh hangat',
      date: today,
      createdAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'jajan-seed-3',
      amount: 35000,
      label: 'Makan siang ayam geprek',
      rawInput: '35rb makan siang ayam geprek',
      date: yesterday,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'jajan-seed-4',
      amount: 5000,
      label: 'Parkir minimarket',
      rawInput: '5000 parkir minimarket',
      date: yesterday,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'jajan-seed-5',
      amount: 25000,
      label: 'Martabak mini sore',
      rawInput: '25rb martabak mini sore',
      date: twoDaysAgo,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ]
}

export const useJajanStore = defineStore('jajan', () => {
  const { pushToCloud } = useCloudSync()

  const monthlyBudget = useLocalStorage<number>(
    'harianku:jajan:monthly-budget',
    1_500_000,
    { initOnMounted: true },
  )

  const expenses = useLocalStorage<JajanExpense[]>(
    'harianku:jajan:expenses',
    createInitialExpenses(),
    { initOnMounted: true },
  )

  function setMonthlyBudget(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return
    const rounded = Math.round(amount)
    monthlyBudget.value = rounded
    void pushToCloud('/api/preferences', 'PUT', { key: 'monthly_budget', value: rounded })
  }

  function addExpense(payload: { amount: number; label: string; rawInput: string; date?: string }) {
    const entry: JajanExpense = {
      id: `jajan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: Math.round(payload.amount),
      label: payload.label.trim() || 'Jajan',
      rawInput: payload.rawInput.trim(),
      date: payload.date || getLocalDateKey(),
      createdAt: new Date().toISOString(),
    }
    expenses.value = [entry, ...expenses.value]
    void pushToCloud('/api/jajan', 'POST', entry as unknown as Record<string, unknown>)
    return entry
  }

  function removeExpense(id: string) {
    expenses.value = expenses.value.filter(item => item.id !== id)
    void pushToCloud(`/api/jajan/${encodeURIComponent(id)}`, 'DELETE')
  }

  function hydrateFromCloud(payload: { expenses?: JajanExpense[]; monthlyBudget?: number }) {
    if (Array.isArray(payload.expenses)) {
      expenses.value = payload.expenses
    }
    if (typeof payload.monthlyBudget === 'number' && Number.isFinite(payload.monthlyBudget)) {
      monthlyBudget.value = payload.monthlyBudget
    }
  }

  function resetToDefault() {
    monthlyBudget.value = 1_500_000
    expenses.value = createInitialExpenses()
  }

  return {
    monthlyBudget,
    expenses,
    setMonthlyBudget,
    addExpense,
    removeExpense,
    hydrateFromCloud,
    resetToDefault,
  }
})
