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
        <ion-title>Categories</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openForm()">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="activeTab" @ionChange="onTabChange">
          <ion-segment-button value="income">Income</ion-segment-button>
          <ion-segment-button value="expense">Expense</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-accordion-group v-else-if="displayCategories.length" :multiple="true" class="categories-accordion">
        <template v-for="cat in displayCategories" :key="cat.id">
          <CategoryItem
            :category="cat"
            @edit="(c) => openForm(c)"
            @delete="(c) => onDelete(c)"
            @toggle-active="(c, isActive) => onToggleActive(c, isActive)"
            @add-child="(parentId) => openForm(null, parentId)"
          />
        </template>
      </ion-accordion-group>
      <div v-else class="empty-state">
        <ion-note>No {{ activeTab }} categories</ion-note>
      </div>
    </ion-content>

    <CategoryForm
      :is-open="formOpen"
      :category="currentCategory"
      :type="activeTab"
      @close="formOpen = false"
      @success="onFormSuccess"
    />
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuToggle,
  IonTitle,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonAccordionGroup,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getCategoryTree, deleteCategory, toggleCategoryActive } from '@/api/accounting'
import CategoryItem from './components/CategoryItem.vue'
import CategoryForm from './components/CategoryForm.vue'

const activeTab = ref('income')
const loading = ref(false)
const incomeCategories = ref([])
const expenseCategories = ref([])
const formOpen = ref(false)
const currentCategory = ref(null)

const displayCategories = computed(() =>
  activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value
)

async function load() {
  loading.value = true
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      getCategoryTree('income'),
      getCategoryTree('expense')
    ])
    incomeCategories.value = incomeRes?.data ?? (incomeRes?.success ? incomeRes?.data : []) ?? []
    expenseCategories.value = expenseRes?.data ?? (expenseRes?.success ? expenseRes?.data : []) ?? []
    if (!Array.isArray(incomeCategories.value)) incomeCategories.value = []
    if (!Array.isArray(expenseCategories.value)) expenseCategories.value = []
  } catch (e) {
    showToast('Failed to load')
    incomeCategories.value = []
    expenseCategories.value = []
  } finally {
    loading.value = false
  }
}

function onTabChange() {}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function openForm(category = null, parentId = null) {
  if (category) {
    if (category.is_default || category.tenant_id == null) {
      showToast('Default categories cannot be edited')
      return
    }
    currentCategory.value = { ...category }
  } else {
    currentCategory.value = {
      parent_id: parentId != null ? Number(parentId) : null,
      type: activeTab.value
    }
  }
  formOpen.value = true
}

async function onDelete(cat) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be deleted')
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${cat.name}"?` })
    await deleteCategory(cat.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

async function onToggleActive(cat, isActive) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be toggled')
    return
  }
  try {
    await toggleCategoryActive(cat.id, isActive)
    showToast(isActive ? 'Activated' : 'Deactivated')
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  }
}

function onFormSuccess() {
  formOpen.value = false
  currentCategory.value = null
  load()
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
.categories-accordion { padding: 0; }
</style>
