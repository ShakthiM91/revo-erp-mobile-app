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
      </ion-list>

      <h4 class="ion-padding-start">Budget by Parent Category</h4>
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
          />
          <ion-toggle v-model="item.is_divertable" slot="end">Divert</ion-toggle>
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
import { ref, reactive, computed, onMounted } from 'vue'
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
  IonButton
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getCategories, getBudgetById, createBudget, updateBudget } from '@/api/accounting'

const route = useRoute()
const router = useRouter()
const planId = computed(() => route.params.id)
const isEdit = computed(() => !!planId.value)

const form = reactive({
  name: '',
  period_type: 'month',
  start_date: '',
  end_date: ''
})
const categoryItems = ref([])
const saving = ref(false)

function buildCategoryItems(categories, existing = []) {
  const map = new Map(existing.map((i) => [i.category_id, i]))
  return (categories || [])
    .filter((c) => c.type === 'expense' && c.parent_id == null)
    .map((cat) => {
      const ex = map.get(cat.id)
      return {
        category_id: cat.id,
        category_name: cat.name,
        amount: ex ? parseFloat(ex.amount) : 0,
        is_divertable: ex ? !!ex.is_divertable : false
      }
    })
}

async function loadCategories() {
  try {
    const res = await getCategories('expense')
    if (!isEdit.value) {
      categoryItems.value = buildCategoryItems(res?.data || [])
    }
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
    form.name = data.name
    form.period_type = data.period_type
    form.start_date = data.start_date
    form.end_date = data.end_date
    const catRes = await getCategories('expense')
    categoryItems.value = buildCategoryItems(catRes?.data || [], data.items || [])
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
    if (isEdit.value) {
      await updateBudget(planId.value, { ...form, items })
      showToast('Budget updated')
    } else {
      await createBudget({ ...form, items })
      showToast('Budget created')
    }
    router.push('/budgets')
  } catch (e) {
    showToast(e?.response?.data?.error || 'Failed')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  if (isEdit.value) await loadPlan()
})
</script>
