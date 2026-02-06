<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/work/projects" />
        </ion-buttons>
        <ion-title>{{ project.project_number || project.work_number || 'Project' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="project.id" @click="$router.push(`/work/projects/${project.id}/edit`)">Edit</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else-if="project.id">
        <ion-list lines="inset">
          <ion-item-divider>Details</ion-item-divider>
          <ion-item>
            <ion-label>
              <h2>Title</h2>
              <p>{{ project.title }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Status</h2>
              <p>{{ formatStatus(project.status) }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Priority</h2>
              <p>{{ (project.priority || '').toUpperCase() }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Vendor</h2>
              <p>{{ project.vendor_name || 'Not selected' }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Total Amount</h2>
              <p>{{ formatCurrency(project.total_amount) }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Start Date</h2>
              <p>{{ formatDate(project.start_date) }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Expected Completion</h2>
              <p>{{ formatDate(project.expected_completion_date) }}</p>
            </ion-label>
          </ion-item>
          <ion-item v-if="project.description">
            <ion-label>
              <h2>Description</h2>
              <p>{{ project.description }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </template>
      <div v-else class="empty-state">
        <ion-note>Project not found</ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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
  IonItemDivider,
  IonLabel,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { getProjectById } from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const project = reactive({})
const loading = ref(true)
const defaultCurrency = ref({ code: 'USD' })

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

async function load() {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    const res = await getProjectById(id)
    const data = res?.data ?? res
    Object.assign(project, data || {})
  } catch (_) {
    Object.assign(project, {})
  } finally {
    loading.value = false
  }
}

async function loadDefaultCurrency() {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
}

onMounted(async () => {
  await loadDefaultCurrency()
  await load()
})
watch(() => route.params.id, () => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
