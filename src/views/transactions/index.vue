<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
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
            <ion-item button @click="$router.push(`/transactions/${row.id}`)">
              <ion-label>
                <h2>{{ row.transaction_number || '-' }}</h2>
                <p>{{ formatDate(row.transaction_date) }} · {{ getCategoryLabel(row) }}</p>
              </ion-label>
              <span slot="end" :class="amountClass(row)">{{ row.type === 'income' ? '+' : row.type === 'transfer' ? '→' : '-' }}{{ formatCurrency(row.amount) }}</span>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="primary" @click="$router.push(`/transactions/${row.id}`)">Edit</ion-item-option>
              <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
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
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
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
import { arrowDownOutline, arrowUpOutline, swapHorizontalOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getTransactions, deleteTransaction, getSummary } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'

const list = ref([])
const listQuery = ref({ type: '', limit: 30, offset: 0 })
const summary = ref({ total_income: 0, total_expense: 0 })
const defaultCurrency = ref({ code: 'USD' })
const loading = ref(false)
const finished = ref(false)

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

async function load () {
  loading.value = true
  try {
    const res = await getTransactions(listQuery.value)
    const data = res?.data || []
    if (listQuery.value.offset === 0) list.value = data
    else list.value.push(...data)
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

async function onDelete (row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.transaction_number}"?` })
    await deleteTransaction(row.id)
    showToast('Deleted')
    listQuery.value.offset = 0
    finished.value = false
    await Promise.all([load(), fetchSummary()])
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onIonViewDidEnter(() => {
  refreshData()
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
</style>
