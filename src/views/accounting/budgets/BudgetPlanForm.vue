<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Budget' : 'Create Budget' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item v-if="!isEdit">
          <ion-label position="stacked">Workspace</ion-label>
          <ion-select
            v-model="form.workspace_id"
            interface="action-sheet"
            placeholder="Select workspace"
            @ionChange="onWorkspaceSelected"
          >
            <ion-select-option v-for="w in workspaces" :key="w.id" :value="w.id">
              {{ w.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item v-else>
          <ion-label position="stacked">Workspace</ion-label>
          <ion-input :value="lockedWorkspaceLabel" readonly />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Plan Name</ion-label>
          <ion-input v-model="form.name" placeholder="e.g. Q1 2025 Budget" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Period Type</ion-label>
          <ion-select v-model="form.period_type" interface="action-sheet">
            <ion-select-option value="week">Week</ion-select-option>
            <ion-select-option value="month">Month</ion-select-option>
            <ion-select-option value="year">Year</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Start Date</ion-label>
          <ion-input v-model="form.start_date" type="date" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">End Date</ion-label>
          <ion-input v-model="form.end_date" type="date" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Currency</ion-label>
          <ion-select v-model="form.currency" interface="action-sheet">
            <ion-select-option
              v-for="c in currencyOptions"
              :key="c.code"
              :value="c.code"
            >
              {{ c.code }} - {{ c.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label>Recurring budget</ion-label>
          <ion-toggle slot="end" v-model="form.is_recurring" />
        </ion-item>
      </ion-list>

      <ion-note v-if="sourcePlanLabel" color="primary" class="ion-padding-start ion-padding-end" style="display: block; margin-bottom: 8px;">
        Auto-generated from: {{ sourcePlanLabel }}
      </ion-note>

      <h4 class="ion-padding-start">Budget by category</h4>
      <ion-note v-if="!categoryWorkspaceId" color="warning" class="ion-padding-start ion-padding-end warn-note">
        Select a workspace above to load categories. Workspace cannot be changed after the plan is created.
      </ion-note>
      <p v-else class="ion-padding-start ion-padding-end hint-text">
        Enter an amount to include a category; leave 0 to exclude. Sub-categories only will get a calculated parent on save.
      </p>
      <ion-note v-if="childrenExceedParentWarning" color="warning" class="ion-padding-start ion-padding-end warn-note">
        {{ childrenExceedParentWarning }}
      </ion-note>

      <ion-toolbar v-if="categoryWorkspaceId">
        <ion-searchbar
          v-model="categoryFilterSearch"
          placeholder="Filter categories..."
          :debounce="200"
        />
      </ion-toolbar>

      <ion-list v-if="categoryWorkspaceId" lines="inset">
        <template v-for="row in filteredDisplayRows" :key="row.category_id">
          <ion-item :class="{ 'row-child': row._rowKind === 'child' }">
            <ion-label class="ion-text-wrap">
              <p v-if="row._rowKind === 'child'" class="child-prefix">—</p>
              <h2>
                {{ row.category_name }}
                <ion-badge v-if="budgetState(row.category_id).is_system_calculated" color="medium">Calculated</ion-badge>
              </h2>
            </ion-label>
            <ion-input
              v-model.number="budgetState(row.category_id).amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              class="amount-input"
              :readonly="budgetState(row.category_id).is_system_calculated"
              @ionFocus="selectAmountOnFocus"
              @ionChange="markBudgetAmountsTouched"
            />
            <ion-toggle
              slot="end"
              v-model="budgetState(row.category_id).is_divertable"
              :disabled="
                budgetState(row.category_id).is_system_calculated ||
                  (parseFloat(budgetState(row.category_id).amount) || 0) <= 0
              "
              @ionChange="markBudgetAmountsTouched"
            >
              Divert
            </ion-toggle>
          </ion-item>
        </template>
      </ion-list>

      <div class="ion-padding">
        <ion-button expand="block" :disabled="saving" @click="handleSubmit">
          {{ isEdit ? 'Update' : 'Create' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonSearchbar,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getCategories, getBudgetById, createBudget, updateBudget } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const planId = computed(() => route.params.id)
const isEdit = computed(() => !!planId.value)

const workspaces = ref([])
const lockedWorkspaceId = ref(null)

const form = reactive({
  workspace_id: null,
  name: '',
  period_type: 'month',
  start_date: '',
  end_date: '',
  currency: '',
  is_recurring: true
})
const sourcePlanLabel = ref('')
const expenseCategories = ref([])
const budgetByCategoryId = reactive({})
const categoryFilterSearch = ref('')
const currencyOptions = ref([])
const saving = ref(false)
const hadPositiveBudgetOnLoad = ref(false)
const budgetAmountsTouched = ref(false)

const categoryWorkspaceId = computed(() => {
  if (isEdit.value) return lockedWorkspaceId.value
  return form.workspace_id
})

const lockedWorkspaceLabel = computed(() => {
  const id = lockedWorkspaceId.value
  if (id == null) return '—'
  const w = workspaces.value.find((x) => Number(x.id) === Number(id))
  return w ? w.name : `Workspace #${id}`
})

async function loadWorkspaces() {
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = ownRes?.data ?? []
    const shared = sharedRes?.data?.active ?? []
    const sharedForDropdown = shared.map((s) => ({
      ...s,
      id: s.id,
      name: s.tenant_name ? `${s.name} (${s.tenant_name})` : `${s.name} (shared)`
    }))
    workspaces.value = [...own, ...sharedForDropdown]
  } catch {
    workspaces.value = []
  }
}

function resetCategoryBudgetState() {
  expenseCategories.value = []
  Object.keys(budgetByCategoryId).forEach((k) => {
    delete budgetByCategoryId[k]
  })
}

async function onWorkspaceSelected() {
  budgetAmountsTouched.value = false
  resetCategoryBudgetState()
  await loadCategories()
}

function markBudgetAmountsTouched() {
  budgetAmountsTouched.value = true
}

function budgetState(categoryId) {
  const id = Number(categoryId)
  if (!budgetByCategoryId[id]) {
    budgetByCategoryId[id] = { amount: 0, is_divertable: false, is_system_calculated: false }
  }
  return budgetByCategoryId[id]
}

function parseBudgetLineAmount(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function initBudgetStateDefaults() {
  for (const c of expenseCategories.value || []) {
    if (c.type !== 'expense') continue
    const id = Number(c.id)
    budgetByCategoryId[id] = { amount: 0, is_divertable: false, is_system_calculated: false }
  }
}

function mergeCategoriesFromPlanItems(items = []) {
  const existing = new Set((expenseCategories.value || []).map((c) => Number(c.id)))
  const toAdd = []
  for (const i of items || []) {
    const id = Number(i.category_id)
    if (Number.isNaN(id) || existing.has(id)) continue
    existing.add(id)
    toAdd.push({
      id,
      name: i.category_name || `Category #${id}`,
      type: i.category_type || 'expense',
      parent_id: i.parent_id != null ? Number(i.parent_id) : null,
      tenant_id: null,
      is_default: false,
      is_active: true,
      sort_order: 0
    })
  }
  if (toAdd.length) {
    expenseCategories.value = [...(expenseCategories.value || []), ...toAdd]
  }
}

function applyPlanItemsToState(items = []) {
  for (const i of items || []) {
    const id = Number(i.category_id)
    if (Number.isNaN(id)) continue
    if (!budgetByCategoryId[id]) {
      budgetByCategoryId[id] = { amount: 0, is_divertable: false, is_system_calculated: false }
    }
    budgetByCategoryId[id].amount = parseFloat(i.amount) || 0
    budgetByCategoryId[id].is_divertable = Boolean(i.is_divertable)
    budgetByCategoryId[id].is_system_calculated = Boolean(i.is_system_calculated)
  }
}

const displayTreeRows = computed(() => {
  const cats = (expenseCategories.value || []).filter((c) => c.type === 'expense')
  const parents = cats.filter((c) => c.parent_id == null).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const rows = []
  const placed = new Set()
  for (const p of parents) {
    const pid = Number(p.id)
    rows.push({ category_id: pid, category_name: p.name, parent_id: null, _rowKind: 'parent' })
    placed.add(pid)
    const kids = cats
      .filter((c) => Number(c.parent_id) === pid)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    for (const c of kids) {
      rows.push({ category_id: Number(c.id), category_name: c.name, parent_id: pid, _rowKind: 'child' })
      placed.add(Number(c.id))
    }
  }
  for (const c of cats) {
    const id = Number(c.id)
    if (placed.has(id)) continue
    rows.push({
      category_id: id,
      category_name: c.name,
      parent_id: c.parent_id != null ? Number(c.parent_id) : null,
      _rowKind: 'orphan'
    })
  }
  return rows
})

const filteredDisplayRows = computed(() => {
  const q = (categoryFilterSearch.value || '').trim().toLowerCase()
  if (!q) return displayTreeRows.value
  return displayTreeRows.value.filter((row) => (row.category_name || '').toLowerCase().includes(q))
})

const childrenExceedParentWarning = computed(() => {
  const msgs = []
  const cats = (expenseCategories.value || []).filter((c) => c.type === 'expense')
  const parents = cats.filter((c) => c.parent_id == null)
  for (const p of parents) {
    const pid = Number(p.id)
    const pst = budgetByCategoryId[pid]
    if (!pst || pst.is_system_calculated) continue
    const pb = parseFloat(pst.amount) || 0
    if (pb <= 0) continue
    const sum = cats
      .filter((c) => Number(c.parent_id) === pid)
      .reduce((s, c) => s + (parseFloat(budgetByCategoryId[Number(c.id)]?.amount) || 0), 0)
    if (sum > pb) {
      msgs.push(
        `Under "${p.name}", sub-categories total ${sum.toFixed(2)} vs parent ${pb.toFixed(2)}.`
      )
    }
  }
  return msgs.length ? msgs.join(' ') : ''
})

function buildItemsForApi() {
  const out = []
  for (const c of expenseCategories.value || []) {
    if (c.type !== 'expense') continue
    const id = Number(c.id)
    const st = budgetByCategoryId[id]
    if (!st || st.is_system_calculated) continue
    const amt = parseFloat(st.amount) || 0
    if (amt <= 0) continue
    out.push({ category_id: id, amount: amt, is_divertable: !!st.is_divertable })
  }
  return out
}

function normalizeDateForInput(val) {
  if (!val) return ''
  const s = String(val).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function selectAmountOnFocus(ev) {
  const el = ev?.target?.$el ?? ev?.target
  const input = el?.shadowRoot?.querySelector('input') ?? el?.querySelector('input')
  nextTick(() => input?.select?.())
}

async function loadCategories() {
  const ws = categoryWorkspaceId.value
  if (ws == null || ws === '') {
    resetCategoryBudgetState()
    return
  }
  try {
    const res = await getCategories('expense', { workspace_id: ws })
    expenseCategories.value = res?.data || []
    initBudgetStateDefaults()
  } catch (e) {
    showToast('Failed to load categories')
  }
}

async function loadPlan() {
  if (!planId.value) return
  try {
    const res = await getBudgetById(planId.value)
    const data = res?.data
    if (!data) {
      showToast('Budget not found')
      router.push('/budgets')
      return
    }
    lockedWorkspaceId.value =
      data.workspace_id != null && data.workspace_id !== '' ? Number(data.workspace_id) : null
    form.name = data.name || ''
    form.period_type = data.period_type || 'month'
    form.start_date = normalizeDateForInput(data.start_date)
    form.end_date = normalizeDateForInput(data.end_date)
    form.currency = data.currency || 'USD'
    form.is_recurring = data.is_recurring !== false && data.is_recurring !== 0
    sourcePlanLabel.value = ''
    if (data.source_plan_id) {
      try {
        const src = await getBudgetById(data.source_plan_id)
        const n = src?.data?.name
        sourcePlanLabel.value = n ? `${n} (#${data.source_plan_id})` : `Plan #${data.source_plan_id}`
      } catch {
        sourcePlanLabel.value = `Plan #${data.source_plan_id}`
      }
    }
    const ws = lockedWorkspaceId.value
    const cats =
      expenseCategories.value.length > 0
        ? expenseCategories.value
        : ws != null
          ? (await getCategories('expense', { workspace_id: ws }))?.data || []
          : []
    if (expenseCategories.value.length === 0) expenseCategories.value = cats
    mergeCategoriesFromPlanItems(data.items || [])
    initBudgetStateDefaults()
    applyPlanItemsToState(data.items || [])
    hadPositiveBudgetOnLoad.value = (data.items || []).some((i) => parseBudgetLineAmount(i?.amount) > 0)
    budgetAmountsTouched.value = false
    await nextTick()
  } catch (e) {
    showToast('Failed to load')
  }
}

async function handleSubmit() {
  if (!form.name || !form.start_date || !form.end_date) {
    showToast('Fill required fields')
    return
  }
  if (!isEdit.value && (form.workspace_id == null || form.workspace_id === '')) {
    showToast('Select a workspace')
    return
  }
  const items = buildItemsForApi()
  if (!isEdit.value && items.length === 0) {
    showToast('Set at least one category to a positive amount')
    return
  }
  saving.value = true
  try {
    const payload = { ...form, currency: form.currency || 'USD' }
    if (!isEdit.value) {
      payload.workspace_id = form.workspace_id
    }
    if (!isEdit.value || items.length > 0 || budgetAmountsTouched.value) {
      payload.items = items
    }
    if (isEdit.value) {
      await updateBudget(planId.value, payload)
      if (
        items.length === 0 &&
        hadPositiveBudgetOnLoad.value &&
        !budgetAmountsTouched.value
      ) {
        showToast('Plan saved; budget lines unchanged. Refresh if amounts look wrong.')
      } else {
        showToast('Budget updated')
      }
    } else {
      await createBudget(payload)
      showToast('Budget created')
    }
    router.push('/budgets')
  } catch (e) {
    showToast(e?.response?.data?.error || 'Failed')
  } finally {
    saving.value = false
  }
}

const loadCurrencies = async () => {
  try {
    const [listRes, defaultRes] = await Promise.all([
      getTenantCurrencies().catch(() => ({ data: { data: [{ code: 'USD', name: 'US Dollar' }] } })),
      getTenantDefaultCurrency().catch(() => null)
    ])
    const list = listRes?.data?.data ?? listRes?.data ?? []
    currencyOptions.value = Array.isArray(list) ? list : []
    if (!isEdit.value && !form.currency) {
      const def = defaultRes?.data?.data ?? defaultRes?.data
      form.currency = def?.code ?? currencyOptions.value[0]?.code ?? 'USD'
    }
    if (currencyOptions.value.length === 0) {
      currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
      if (!form.currency) form.currency = 'USD'
    }
  } catch {
    currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
    if (!form.currency) form.currency = 'USD'
  }
}

watch(planId, async (id, prev) => {
  if (!id || !isEdit.value) return
  if (prev != null && String(id) === String(prev)) return
  await loadWorkspaces()
  await loadPlan()
})

onMounted(async () => {
  await loadWorkspaces()
  await loadCurrencies()
  if (isEdit.value) {
    await loadPlan()
  } else {
    await loadCategories()
  }
  if (!isEdit.value && !form.currency && currencyOptions.value.length) form.currency = currencyOptions.value[0].code
})
</script>

<style scoped>
.hint-text {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-top: 0;
  margin-bottom: 8px;
}
.warn-note {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  white-space: normal;
}
.row-child {
  --padding-start: 20px;
}
.child-prefix {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin: 0 0 2px 0;
}
.amount-input {
  max-width: 88px;
  text-align: right;
}
ion-badge {
  vertical-align: middle;
  margin-left: 6px;
}
ion-toolbar {
  --background: transparent;
  --border-width: 0;
}
</style>
