import { useState } from '#imports'

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline'

export function useCloudSync() {
  const status = useState<CloudSyncStatus>('harianku:cloud-status', () => 'idle')
  const isHydrating = useState<boolean>('harianku:cloud-hydrating', () => false)

  async function pushToCloud(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>,
  ) {
    if (!import.meta.client || isHydrating.value) return
    try {
      await $fetch(url, { method, body })
      status.value = 'connected'
    } catch {
      status.value = 'offline'
    }
  }

  return {
    status,
    isHydrating,
    pushToCloud,
  }
}
