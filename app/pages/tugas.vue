<script setup lang="ts">
import { CheckSquare, Plus } from 'lucide-vue-next'
import { useAppToast } from '~/composables/useAppToast'
import { useChoresTracker } from '~/composables/useChoresTracker'
import type { ChoreCategory, ChoreStatus } from '~/types'

useHead({
  title: 'Pengingat Tugas Rumah — HarianKu',
})

const { showToast } = useAppToast()
const {
  sortedChores,
  summaryStats,
  completeToday,
  addCustomChore,
  deleteChore,
} = useChoresTracker()

const showAddForm = ref(false)
const statusFilter = ref<'all' | ChoreStatus>('all')

const filteredChores = computed(() => {
  if (statusFilter.value === 'all') return sortedChores.value
  return sortedChores.value.filter(c => c.status === statusFilter.value)
})

function handleComplete(id: string) {
  const target = sortedChores.value.find(c => c.id === id)
  completeToday(id)
  if (target) {
    showToast(`"${target.title}" direset ke hari ini (Hijau 100%)!`, 'success')
  }
}

function handleAddChore(payload: { title: string; category: ChoreCategory; intervalDays: number; notes?: string }) {
  const added = addCustomChore(payload)
  if (added) {
    showToast(`Tugas "${added.title}" ditambahkan (tiap ${added.intervalDays} hari).`, 'success')
    showAddForm.value = false
  }
}

function handleDelete(id: string) {
  const target = sortedChores.value.find(c => c.id === id)
  deleteChore(id)
  if (target) {
    showToast(`Tugas "${target.title}" dihapus.`, 'info')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
          <CheckSquare class="h-3.5 w-3.5" />
          Micro-Chores Tracker
        </div>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
          Pengingat Tugas Berkala
        </h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Pantau tugas kecil rumah tangga yang sering terlupa. Cukup 1 klik "Selesai Hari Ini" untuk reset jadwalnya.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 sm:text-sm"
        @click="showAddForm = !showAddForm"
      >
        <Plus class="h-4 w-4" />
        Tambah Tugas Kustom
      </button>
    </section>

    <!-- Add Custom Chore Form -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <ChoresAddChoreModal
        v-if="showAddForm"
        @submit="handleAddChore"
        @close="showAddForm = false"
      />
    </Transition>

    <!-- Filter & Color Indicator Legend -->
    <section class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
          :class="
            statusFilter === 'all'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
          "
          @click="statusFilter = 'all'"
        >
          Semua ({{ summaryStats.total }})
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition"
          :class="
            statusFilter === 'urgent'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
          "
          @click="statusFilter = 'urgent'"
        >
          <span class="h-2 w-2 rounded-full bg-current" />
          Urgent ({{ summaryStats.urgent }})
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition"
          :class="
            statusFilter === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
          "
          @click="statusFilter = 'warning'"
        >
          <span class="h-2 w-2 rounded-full bg-current" />
          Mendekati ({{ summaryStats.warning }})
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition"
          :class="
            statusFilter === 'safe'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
          "
          @click="statusFilter = 'safe'"
        >
          <span class="h-2 w-2 rounded-full bg-current" />
          Aman ({{ summaryStats.safe }})
        </button>
      </div>

      <p class="text-[11px] font-medium text-stone-400 dark:text-stone-500">
        Hijau &gt; 50% · Kuning 20–50% · Merah &lt; 20%
      </p>
    </section>

    <!-- Chores Grid -->
    <section v-if="filteredChores.length > 0" class="grid gap-4 sm:grid-cols-2">
      <ChoresChoreCard
        v-for="chore in filteredChores"
        :key="chore.id"
        :chore="chore"
        @complete="handleComplete"
        @delete="handleDelete"
      />
    </section>

    <div
      v-else
      class="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center dark:border-stone-800 dark:bg-stone-900"
    >
      <p class="text-sm font-semibold text-stone-700 dark:text-stone-300">
        Tidak ada tugas pada filter ini.
      </p>
      <button
        v-if="statusFilter !== 'all'"
        type="button"
        class="mt-3 rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
        @click="statusFilter = 'all'"
      >
        Tampilkan Semua Tugas
      </button>
    </div>
  </div>
</template>
