import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPendingWrites } from '@/db/pendingWrites'
import { runSync } from '@/utils/syncWorker'

export const useSyncStore = defineStore('sync', () => {
  const pendingCount = ref(0)
  /** @type {import('vue').Ref<Set<number|string>>} */
  const invalidatedAccountIds = ref(new Set())

  async function refreshPendingCount() {
    const entries = await getPendingWrites()
    pendingCount.value = entries.length
  }

  function addInvalidatedAccountIds(ids) {
    const set = invalidatedAccountIds.value
    for (const id of ids) {
      if (id != null) set.add(Number(id))
    }
    invalidatedAccountIds.value = new Set(set)
  }

  function clearInvalidatedAccountId(id) {
    const set = new Set(invalidatedAccountIds.value)
    set.delete(Number(id))
    invalidatedAccountIds.value = set
  }

  function clearAllInvalidated() {
    invalidatedAccountIds.value = new Set()
  }

  const hasPendingSync = computed(() => pendingCount.value > 0)

  async function syncNow() {
    await runSync()
    await refreshPendingCount()
  }

  return {
    pendingCount,
    invalidatedAccountIds: computed(() => invalidatedAccountIds.value),
    hasPendingSync,
    refreshPendingCount,
    addInvalidatedAccountIds,
    clearInvalidatedAccountId,
    clearAllInvalidated,
    syncNow
  }
})
