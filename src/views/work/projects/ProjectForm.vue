<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="id ? `/work/projects/${id}` : '/work/projects'" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Project' : 'Add Project' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Title</ion-label>
            <ion-input v-model="form.title" placeholder="Work order title" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="3" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Category</ion-label>
            <ion-input v-model="form.category" placeholder="e.g. Construction, IT" />
          </ion-item>
          <ion-item button detail @click="showPriorityPicker = true">
            <ion-label position="stacked">Priority</ion-label>
            <ion-note slot="end">{{ form.priority || 'Medium' }}</ion-note>
          </ion-item>
          <ion-item button detail @click="showCurrencyPicker = true">
            <ion-label position="stacked">Currency</ion-label>
            <ion-note slot="end">{{ form.currency || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Estimated Amount</ion-label>
            <ion-input v-model.number="form.total_amount" type="number" step="0.01" placeholder="0" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Start Date</ion-label>
            <ion-input v-model="form.start_date" type="date" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Expected Completion</ion-label>
            <ion-input v-model="form.expected_completion_date" type="date" />
          </ion-item>
          <ion-item v-if="isEdit" button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ formatStatus(form.status) }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showPriorityPicker" @didDismiss="showPriorityPicker = false">
        <ion-header><ion-toolbar><ion-title>Priority</ion-title><ion-buttons slot="end"><ion-button @click="showPriorityPicker = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="p in priorityOptions" :key="p" button @click="form.priority = p; showPriorityPicker = false"><ion-label>{{ p }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showCurrencyPicker" @didDismiss="showCurrencyPicker = false">
        <ion-header><ion-toolbar><ion-title>Currency</ion-title><ion-buttons slot="end"><ion-button @click="showCurrencyPicker = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in currencyOptions" :key="c.code" button @click="form.currency = c.code; showCurrencyPicker = false"><ion-label>{{ c.code }} - {{ c.name }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showStatusPicker = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="s in statusOptions" :key="s" button @click="form.status = s; showStatusPicker = false"><ion-label>{{ formatStatus(s) }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createProject, updateProject, getProjectById } from '@/api/work'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = computed(() => !!id)

const saving = ref(false)
const showPriorityPicker = ref(false)
const showCurrencyPicker = ref(false)
const showStatusPicker = ref(false)
const currencyOptions = ref([])

const priorityOptions = ['low', 'medium', 'high', 'urgent']
const statusOptions = ['draft', 'pending_quotes', 'quotes_received', 'vendor_selected', 'in_progress', 'completed', 'cancelled']

const form = reactive({
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  total_amount: 0,
  currency: 'USD',
  start_date: '',
  expected_completion_date: '',
  status: 'draft'
})

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function loadCurrencies() {
  try {
    const res = await getTenantCurrencies()
    const data = res?.data ?? res
    const list = Array.isArray(data) ? data : (data?.data || [])
    currencyOptions.value = list
    if (list.length && !form.currency) {
      try {
        const def = await getTenantDefaultCurrency()
        const d = def?.data ?? def
        form.currency = d?.code ?? d?.currency_code ?? list[0]?.code ?? 'USD'
      } catch (_) {
        form.currency = list[0]?.code ?? 'USD'
      }
    }
  } catch (_) {
    currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
    if (!form.currency) form.currency = 'USD'
  }
}

async function loadProject() {
  if (!id) return
  try {
    const res = await getProjectById(id)
    const p = res?.data ?? res
    if (p) {
      form.title = p.title || ''
      form.description = p.description || ''
      form.category = p.category || ''
      form.priority = p.priority || 'medium'
      form.total_amount = p.total_amount ?? 0
      form.currency = p.currency || 'USD'
      form.start_date = p.start_date ? p.start_date.slice(0, 10) : ''
      form.expected_completion_date = p.expected_completion_date ? p.expected_completion_date.slice(0, 10) : ''
      form.status = p.status || 'draft'
    }
  } catch (e) {
    showToast('Failed to load')
    router.back()
  }
}

onMounted(async () => {
  await loadCurrencies()
  if (id) await loadProject()
})

watch(() => route.params.id, (newId) => {
  if (newId) loadProject()
})

async function submit() {
  const title = (form.title || '').trim()
  if (!title) {
    showToast('Enter title')
    return
  }
  saving.value = true
  try {
    const data = {
      title,
      description: form.description?.trim() || null,
      category: form.category?.trim() || null,
      priority: form.priority,
      total_amount: form.total_amount ?? 0,
      currency: form.currency || 'USD',
      start_date: form.start_date || null,
      expected_completion_date: form.expected_completion_date || null,
      status: form.status
    }
    if (id) {
      await updateProject(id, data)
    } else {
      await createProject(data)
    }
    showToast(id ? 'Updated' : 'Created')
    router.back()
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
