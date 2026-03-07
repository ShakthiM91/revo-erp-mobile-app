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
      </ion-list>

      <h4 class="ion-padding-start">Budget by Parent Category</h4>
      <p class="ion-padding-start ion-padding-end hint-text">Add categories to budget. Removed categories' expenses are excluded from reports.</p>
      <div class="ion-padding-start ion-padding-end ion-padding-bottom">
        <ion-button fill="outline" size="small" @click="openAddCategoryModal">
          Add category
        </ion-button>
      </div>

      <ion-modal :is-open="addCategoryModalOpen" @didDismiss="onAddCategoryModalDismiss" @ionModalDidPresent="focusModalSearch">
        <ion-header>
          <ion-toolbar>
            <ion-title>Add categories to budget</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="onAddCategoryModalDismiss">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              ref="addCategorySearchRef"
              v-model="addCategorySearchQuery"
              placeholder="Search categories..."
              :debounce="150"
            />
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list v-if="filteredCategoriesToAdd.length > 0" lines="inset">
            <ion-item
              v-for="cat in filteredCategoriesToAdd"
              :key="cat.id"
              button
              @click="addCategoryFromModal(cat.id)"
            >
              <ion-label>{{ cat.name }}</ion-label>
              <ion-icon slot="end" :icon="addOutline" />
            </ion-item>
          </ion-list>
          <div v-else class="add-category-empty">
            <ion-note>
              {{ availableCategoriesToAdd.length === 0
                ? 'All categories have been added'
                : `No categories match "${addCategorySearchQuery}"`
              }}
            </ion-note>
          </div>
        </ion-content>
      </ion-modal>
      <ion-list lines="inset">
        <ion-item v-for="item in categoryItems" :key="item.category_id">
          <ion-label>{{ item.category_name }}</ion-label>
          <ion-input
            v-model.number="item.amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            style="max-width: 90px; text-align: right"
            @ionFocus="selectAmountOnFocus"
          />
          <ion-toggle v-model="item.is_divertable" slot="end">Divert</ion-toggle>
          <ion-button fill="clear" color="danger" size="small" slot="end" @click="removeCategory(item)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-item>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
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
  IonModal,
  IonSearchbar,
  IonIcon,
  IonNote
} from '@ionic/vue'
import { addOutline, trashOutline } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { getCategories, getBudgetById, createBudget, updateBudget } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const planId = computed(() => route.params.id)
const isEdit = computed(() => !!planId.value)

const form = reactive({
  name: '',
  period_type: 'month',
  start_date: '',
  end_date: '',
  currency: ''
})
const expenseCategories = ref([])
const categoryItems = ref([])
const addCategoryModalOpen = ref(false)
const addCategorySearchQuery = ref('')
const addCategorySearchRef = ref(null)
const currencyOptions = ref([])
const saving = ref(false)

const parentExpenseCategories = computed(() =>
  (expenseCategories.value || []).filter((c) => c.type === 'expense' && c.parent_id == null)
)

const availableCategoriesToAdd = computed(() => {
  const idsInTable = new Set(categoryItems.value.map((i) => i.category_id))
  return parentExpenseCategories.value.filter((c) => !idsInTable.has(c.id))
})

const filteredCategoriesToAdd = computed(() => {
  const q = (addCategorySearchQuery.value || '').trim().toLowerCase()
  if (!q) return availableCategoriesToAdd.value
  return availableCategoriesToAdd.value.filter((c) =>
    (c.name || '').toLowerCase().includes(q)
  )
})

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

function buildCategoryItemsFromExisting(categories, existingItems = []) {
  const catMap = new Map((categories || []).map((c) => [c.id, c]))
  return (existingItems || [])
    .filter((i) => catMap.has(i.category_id))
    .map((i) => {
      const cat = catMap.get(i.category_id)
      return {
        category_id: i.category_id,
        category_name: cat?.name || 'Unknown',
        amount: parseFloat(i.amount) || 0,
        is_divertable: Boolean(i.is_divertable)
      }
    })
}

function openAddCategoryModal(e) {
  e?.currentTarget?.blur()
  addCategoryModalOpen.value = true
}

function focusModalSearch() {
  nextTick(() => {
    const el = addCategorySearchRef.value?.$el
    if (typeof el?.setFocus === 'function') {
      el.setFocus()
    } else {
      const input = el?.shadowRoot?.querySelector('input') ?? el?.querySelector('input')
      input?.focus()
    }
  })
}

function onAddCategoryModalDismiss() {
  addCategoryModalOpen.value = false
  addCategorySearchQuery.value = ''
}

function addCategoryFromModal(categoryId) {
  const id = categoryId != null ? Number(categoryId) : null
  if (id == null || isNaN(id)) return
  const cat = parentExpenseCategories.value.find((c) => Number(c.id) === id)
  if (!cat || categoryItems.value.some((i) => i.category_id === id)) return
  categoryItems.value.push({
    category_id: cat.id,
    category_name: cat.name,
    amount: 0,
    is_divertable: false
  })
}

function selectAmountOnFocus(ev) {
  const el = ev?.target?.$el ?? ev?.target
  const input = el?.shadowRoot?.querySelector('input') ?? el?.querySelector('input')
  nextTick(() => input?.select?.())
}

function removeCategory(row) {
  categoryItems.value = categoryItems.value.filter((i) => i.category_id !== row.category_id)
}

async function loadCategories() {
  try {
    const res = await getCategories('expense')
    expenseCategories.value = res?.data || []
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
    form.name = data.name || ''
    form.period_type = data.period_type || 'month'
    form.start_date = normalizeDateForInput(data.start_date)
    form.end_date = normalizeDateForInput(data.end_date)
    form.currency = data.currency || 'USD'
    const cats = expenseCategories.value.length > 0 ? expenseCategories.value : (await getCategories('expense'))?.data || []
    if (expenseCategories.value.length === 0) expenseCategories.value = cats
    categoryItems.value = buildCategoryItemsFromExisting(cats, data.items || [])
  } catch (e) {
    showToast('Failed to load')
  }
}

async function handleSubmit() {
  const items = categoryItems.value
    .filter((i) => i.amount > 0)
    .map((i) => ({ category_id: i.category_id, amount: parseFloat(i.amount), is_divertable: !!i.is_divertable }))
  if (!form.name || !form.start_date || !form.end_date) {
    showToast('Fill required fields')
    return
  }
  if (items.length === 0) {
    showToast('Add at least one category')
    return
  }
  saving.value = true
  try {
    const payload = { ...form, currency: form.currency || 'USD', items }
    if (isEdit.value) {
      await updateBudget(planId.value, payload)
      showToast('Budget updated')
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

onMounted(async () => {
  await loadCurrencies()
  await loadCategories()
  if (isEdit.value) await loadPlan()
  else if (!form.currency && currencyOptions.value.length) form.currency = currencyOptions.value[0].code
})
</script>

<style scoped>
.hint-text {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-top: 0;
  margin-bottom: 8px;
}

.add-category-empty {
  padding: 32px 20px;
  text-align: center;
}

.add-category-empty ion-note {
  font-size: 14px;
}
</style>
