<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-toggle>
            <ion-button>
              <ion-icon :icon="menuOutline" />
            </ion-button>
          </ion-menu-toggle>
        </ion-buttons>
        <ion-title>Transactions</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/transactions/create?type=income')" class="toolbar-btn income" title="Add income">
            <ion-icon :icon="arrowDownOutline" />
          </ion-button>
          <ion-button @click="$router.push('/transactions/create?type=expense')" class="toolbar-btn expense" title="Add expense">
            <ion-icon :icon="arrowUpOutline" />
          </ion-button>
          <ion-button @click="$router.push('/transactions/create?type=transfer')" class="toolbar-btn transfer" title="Add transfer">
            <ion-icon :icon="swapHorizontalOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="summary-grid">
        <ion-grid>
          <ion-row>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Income</span><span class="sum-val income">{{ formatCurrency(summary.total_income) }}</span></div></ion-col>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Expense</span><span class="sum-val expense">{{ formatCurrency(summary.total_expense) }}</span></div></ion-col>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Net</span><span class="sum-val" :class="net >= 0 ? 'income' : 'expense'">{{ formatCurrency(net) }}</span></div></ion-col>
          </ion-row>
        </ion-grid>
      </div>


      <ion-item lines="none">
        <ion-select label="Type" :value="listQuery.type" @ionChange="onTypeFilter($event)" interface="action-sheet" placeholder="All">
          <ion-select-option value="">All</ion-select-option>
          <ion-select-option value="income">Income</ion-select-option>
          <ion-select-option value="expense">Expense</ion-select-option>
          <ion-select-option value="transfer">Transfer</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <template v-if="loading && list.length === 0">
        <div v-for="i in 5" :key="'sk-' + i" class="list-skeleton">
          <ion-skeleton-text animated style="width: 60%; height: 16px" />
          <ion-skeleton-text animated style="width: 40%; height: 12px; margin-top: 8px" />
        </div>
      </template>
      <template v-else>
        <ion-list lines="inset">
          <ion-item-sliding v-for="row in list" :key="row.id">
            <ion-item button @click="onRowClick(row)">
              <ion-label>
                <h2>{{ row.transaction_number || '-' }}</h2>
                <p>{{ formatDate(row.transaction_date) }} · {{ getCategoryLabel(row) }}</p>
              </ion-label>
              <span slot="end" :class="amountClass(row)">{{ row.type === 'income' ? '+' : row.type === 'transfer' ? '→' : '-' }}{{ formatCurrency(row.amount) }}</span>
              <ion-icon v-if="row._pending" :icon="cloudOfflineOutline" slot="end" class="pending-icon" title="Not synced" />
            </ion-item>
            <ion-item-options side="end">
              <template v-if="row._pending">
                <ion-item-option color="warning" @click="onRemoveFromQueue(row)">Remove from queue</ion-item-option>
              </template>
              <template v-else>
                <ion-item-option color="primary" @click="$router.push(`/transactions/${row.id}`)">Edit</ion-item-option>
                <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
              </template>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
        <ion-infinite-scroll
          v-if="!finished && list.length > 0"
          @ionInfinite="onLoad"
          threshold="100px"
        >
          <ion-infinite-scroll-content loading-spinner="crescent" />
        </ion-infinite-scroll>
      </template>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No transactions</ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuToggle,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote,
  onIonViewDidEnter
} from '@ionic/vue'
import { arrowDownOutline, arrowUpOutline, swapHorizontalOutline, menuOutline, cloudOfflineOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getTransactions, deleteTransaction, getSummary } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import { getPendingWrites, deleteEntry } from '@/db/pendingWrites'
import { useSyncStore } from '@/store/sync'

const router = useRouter()
const syncStore = useSyncStore()
const list = ref([])
const listQuery = ref({ type: '', limit: 30, offset: 0 })
const summary = ref({ total_income: 0, total_expense: 0 })
const defaultCurrency = ref({ code: 'USD' })
const loading = ref(false)
const finished = ref(false)

function isTransactionEntry(entry) {
  return entry.method === 'POST' && typeof entry.url === 'string' && entry.url.includes('transactions')
}

function pendingEntryToRow(entry) {
  const p = entry.payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + entry.id,
    _pending: true,
    _pendingId: entry.id,
    transaction_number: p.transaction_number || '-',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

function payloadToRow(id, payload) {
  const p = payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + id,
    _pending: true,
    _pendingId: id,
    transaction_number: p.transaction_number || '-',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

const net = computed(() => (summary.value.total_income || 0) - (summary.value.total_expense || 0))

function formatCurrency (v, code) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code || defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}
function formatDate (s) {
  if (!s) return '-'
  return new Date(s).toISOString().split('T')[0]
}
function getCategoryLabel (row) {
  return row.category_name || row.category || '-'
}
function amountClass (row) {
  return row.type === 'income' ? 'income' : row.type === 'transfer' ? 'transfer' : 'expense'
}

async function loadPendingRows() {
  const typeFilter = listQuery.value.type || ''
  try {
    const entries = await getPendingWrites()
    const transactionEntries = entries.filter(isTransactionEntry)
    const filtered = typeFilter
      ? transactionEntries.filter((e) => (e.payload?.type || '') === typeFilter)
      : transactionEntries
    return filtered.map(pendingEntryToRow)
  } catch (_) {
    return []
  }
}

function mergeAndSort(pendingRows, serverData) {
  const merged = [...pendingRows, ...serverData]
  const sortByDate = (a, b) => {
    const da = (a.transaction_date || '').replace(' ', 'T')
    const db = (b.transaction_date || '').replace(' ', 'T')
    return new Date(db) - new Date(da)
  }
  merged.sort(sortByDate)
  return merged
}

async function load () {
  loading.value = true
  try {
    const res = await getTransactions(listQuery.value)
    const data = res?.data || []
    if (listQuery.value.offset === 0) {
      const pendingRows = await loadPendingRows()
      list.value = mergeAndSort(pendingRows, data)
    } else {
      list.value.push(...data)
    }
    listQuery.value.offset += data.length
    finished.value = data.length < (listQuery.value.limit || 30)
  } catch (e) {
    showToast('Failed to load')
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function fetchSummary () {
  try {
    const res = await getSummary()
    if (res?.success && res?.data) summary.value = res.data
  } catch (_) {}
}

function onTypeFilter (e) {
  listQuery.value.type = e.detail.value
  onFilter()
}
async function onFilter () {
  listQuery.value.offset = 0
  finished.value = false
  await load()
}

async function refreshData () {
  listQuery.value.offset = 0
  finished.value = false
  await Promise.all([load(), fetchSummary()])
}

async function onRefresh (ev) {
  await refreshData()
  ev.target.complete()
}

async function onLoad (ev) {
  await load()
  ev.target.complete()
}

function onRowClick (row) {
  if (row._pending) {
    showToast('Syncing when online')
    return
  }
  return router.push(`/transactions/${row.id}`)
}

async function onRemoveFromQueue (row) {
  if (!row._pending || !row._pendingId) return
  try {
    await deleteEntry(row._pendingId)
    showToast('Removed from queue')
    await refreshData()
  } catch (e) {
    showToast(e?.message || 'Failed to remove')
  }
}

async function onDelete (row) {
  if (row._pending) {
    await onRemoveFromQueue(row)
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.transaction_number}"?` })
    const res = await deleteTransaction(row.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
    listQuery.value.offset = 0
    finished.value = false
    await Promise.all([load(), fetchSummary()])
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

watch(
  () => syncStore.transactionListInvalidatedAt,
  (val) => {
    if (val > 0) refreshData()
  }
)

onIonViewDidEnter(() => {
  const queued = syncStore.consumeLastQueuedTransaction()
  if (queued) {
    const row = payloadToRow(queued.id, queued.payload)
    const typeFilter = listQuery.value.type || ''
    if (!typeFilter || row.type === typeFilter) {
      list.value = mergeAndSort([row], list.value)
    }
  } else {
    refreshData()
  }
  refreshBootstrapCache().catch(() => {})
})

onMounted(async () => {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (e) {
    showToast('Failed to load default currency', e?.message)
  }
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.summary-grid { background: #f7f8fa; padding: 12px 8px; }
.sum-cell { display: flex; flex-direction: column; align-items: center; }
.sum-label { font-size: 11px; color: #969799; }
.sum-val { font-size: 13px; font-weight: 600; }
.sum-val.income { color: #07c160; }
.sum-val.expense { color: #ee0a24; }
.quick-actions { display: flex; gap: 8px; padding: 12px 16px; flex-wrap: wrap; }
.quick-actions .quick-btn { flex: 1; min-width: 0; margin: 0; }
.quick-actions .quick-btn.income { --border-color: #07c160; --color: #07c160; }
.quick-actions .quick-btn.expense { --border-color: #ee0a24; --color: #ee0a24; }
.quick-actions .quick-btn.transfer { --border-color: #1989fa; --color: #1989fa; }
.list-skeleton { padding: 12px 16px; }
.empty-state { padding: 48px 16px; text-align: center; }
.income { color: #07c160; }
.expense { color: #ee0a24; }
.transfer { color: #1989fa; }
.toolbar-btn.income ion-icon { color: #07c160; }
.toolbar-btn.expense ion-icon { color: #ee0a24; }
.toolbar-btn.transfer ion-icon { color: #1989fa; }
.pending-icon { margin-left: 6px; font-size: 20px; color: var(--ion-color-medium); }
</style>
