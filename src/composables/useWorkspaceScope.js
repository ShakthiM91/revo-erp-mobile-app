import { ref, computed, onMounted } from 'vue'
import { getWorkspaces } from '@/api/workspace'

/**
 * Tenant workspace list and workspace_mode from GET /api/accounting/workspaces.
 */
export function useWorkspaceScope() {
  const loading = ref(true)
  const workspaceMode = ref('shared')
  const workspaces = ref([])

  const defaultWorkspaceId = computed(() => {
    const list = workspaces.value
    if (!list?.length) return null
    const def = list.find((w) => w.is_default)
    return def?.id ?? list[0]?.id ?? null
  })

  async function loadWorkspaces() {
    loading.value = true
    try {
      const ownRes = await getWorkspaces()
      workspaces.value = ownRes?.data ?? []
      workspaceMode.value = ownRes?.workspace_mode || 'shared'
    } catch {
      workspaces.value = []
      workspaceMode.value = 'shared'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadWorkspaces()
  })

  return {
    loading,
    workspaceMode,
    workspaces,
    defaultWorkspaceId,
    loadWorkspaces
  }
}
