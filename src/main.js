import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import router from './router'
import { setRouter } from '@/utils/request'
import { setTransactionInvalidationHandler, setTransactionListInvalidationHandler, runSync } from '@/utils/syncWorker'
import { useSyncStore } from '@/store/sync'
import { getToken } from '@/utils/auth'
import { warmBootstrapCache, refreshBootstrapCache } from '@/utils/bootstrapCache'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(IonicVue)
app.use(router)
setRouter(router)

app.mount('#app')

// Warm bootstrap cache on app start when user is authenticated
if (getToken()) {
  warmBootstrapCache().catch(() => {})
}

// Register sync: when a transaction syncs, invalidate affected account balance/flow log and transaction list
const syncStore = useSyncStore()
setTransactionInvalidationHandler((accountIds) => {
  syncStore.addInvalidatedAccountIds(accountIds)
})
setTransactionListInvalidationHandler(() => {
  syncStore.setTransactionListInvalidated()
})
syncStore.refreshPendingCount()

// Periodic sync while app is running (when online and authenticated)
const SYNC_INTERVAL_MS = 45000
setInterval(() => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  if (!getToken()) return
  runSync().then(() => syncStore.refreshPendingCount())
}, SYNC_INTERVAL_MS)

// On app resume: run write sync and refresh read cache when online
async function initAppResumeSync() {
  function onResume() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    runSync().then(() => syncStore.refreshPendingCount())
    refreshBootstrapCache().catch(() => {})
  }
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onResume()
    })
  } catch {
    // Not in Capacitor (e.g. browser/PWA); use visibility fallback
  }
  // Fallback for PWA/browser: sync when user returns to tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onResume()
    })
  }
}
initAppResumeSync()
