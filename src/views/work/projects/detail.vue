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
      <ion-toolbar>
        <ion-segment :value="activeTab" @ionChange="activeTab = $event.detail.value">
          <ion-segment-button value="overview">Overview</ion-segment-button>
          <ion-segment-button value="quotes">Quotes</ion-segment-button>
          <ion-segment-button value="stages">Stages</ion-segment-button>
          <ion-segment-button value="payments">Payments</ion-segment-button>
          <ion-segment-button value="audit">Audit</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else-if="project.id">
        <div class="detail-header">
          <h2>{{ project.title }}</h2>
          <ion-badge :color="getStatusColor(project.status)">{{ formatStatus(project.status) }}</ion-badge>
        </div>
        <ion-list lines="none" class="progress-cards">
          <ion-item>
            <ion-label>
              <p>Work Progress</p>
              <ion-progress-bar :value="(summary.progress?.progress_percentage || 0) / 100" />
              <p class="stat">{{ summary.progress?.completed_stages || 0 }} / {{ summary.progress?.total_stages || 0 }} stages</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <p>Payment Progress</p>
              <ion-progress-bar :value="(summary.payments?.payment_percentage || 0) / 100" color="success" />
              <p class="stat">{{ formatCurrency(summary.payments?.total_paid || 0) }} paid</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div v-show="activeTab === 'overview'" class="tab-content">
          <ProjectOverview
            :overview="summary"
            :currency-code="defaultCurrency?.code || 'USD'"
            @add-stage="handleAddStage"
            @record-payment="handleRecordPayment"
            @add-additional-work="handleAddAdditionalWork"
          />
        </div>

        <div v-show="activeTab === 'quotes'" class="tab-content">
          <div class="tab-actions">
            <ion-button v-if="!isProjectLocked && !hasAcceptedQuote" size="small" @click="handleAddQuote">Add Quote</ion-button>
            <ion-button v-if="quotes.length > 1 && !isProjectLocked" size="small" fill="outline" @click="handleCompareQuotes">Compare</ion-button>
          </div>
          <ion-note v-if="hasAcceptedQuote" class="info-note">A quote has been accepted. No additional quotations can be added.</ion-note>
          <ion-list v-else-if="quotes.length" lines="inset">
            <ion-item v-for="q in quotes" :key="q.id">
              <ion-label>
                <h2>{{ q.vendor_name }}</h2>
                <p>{{ formatCurrency(q.quoted_amount) }} · {{ q.estimated_duration_days }} days</p>
                <p>{{ formatDate(q.validity_date) }} · {{ formatStatus(q.status) }}</p>
              </ion-label>
              <ion-badge v-if="q.is_lowest" color="success" slot="end">Lowest</ion-badge>
              <ion-buttons slot="end">
                <ion-button size="small" @click="handleViewQuote(q)">View</ion-button>
                <template v-if="q.status === 'pending' && !isProjectLocked">
                  <ion-button size="small" @click="handleEditQuote(q)">Edit</ion-button>
                  <ion-button size="small" color="success" @click="handleAcceptQuote(q)">Accept</ion-button>
                  <ion-button size="small" color="danger" @click="handleRejectQuote(q)">Reject</ion-button>
                </template>
              </ion-buttons>
            </ion-item>
          </ion-list>
          <ion-note v-else class="empty-note">No quotes</ion-note>
        </div>

        <div v-show="activeTab === 'stages'" class="tab-content">
          <div class="tab-actions">
            <ion-button v-if="!isProjectLocked" size="small" @click="handleAddStage">Add Stage</ion-button>
          </div>
          <ion-list v-if="stages.length" lines="inset">
            <ion-item v-for="s in stages" :key="s.id">
              <ion-label>
                <h2>#{{ s.stage_number }} {{ s.title }}</h2>
                <p>{{ formatStatus(s.status) }} · Start: {{ formatCurrency(s.start_payment_amount) }} · End: {{ formatCurrency(s.end_payment_amount) }}</p>
                <p>{{ formatDate(s.expected_date) }}</p>
              </ion-label>
              <ion-buttons slot="end">
                <template v-if="s.status === 'planned' && !isProjectLocked">
                  <ion-button size="small" @click="handleEditStage(s)">Edit</ion-button>
                  <ion-button size="small" @click="handleStartStage(s)">Start</ion-button>
                </template>
                <template v-else-if="s.status === 'start_payment_due' && s.start_payment_amount > 0 && !isProjectLocked">
                  <ion-button size="small" color="success" @click="handleRecordStartPayment(s)">Start Payment</ion-button>
                </template>
                <template v-else-if="s.status === 'in_progress' && !isProjectLocked">
                  <ion-button size="small" @click="handleCompleteStage(s)">Complete</ion-button>
                </template>
                <template v-else-if="s.status === 'completed' && !isProjectLocked">
                  <ion-button size="small" color="success" @click="handleApproveStage(s)">Approve</ion-button>
                </template>
                <template v-else-if="s.status === 'end_payment_due' && s.end_payment_amount > 0 && !isProjectLocked">
                  <ion-button size="small" color="success" @click="handleRecordEndPayment(s)">End Payment</ion-button>
                </template>
                <ion-badge v-else-if="s.status === 'closed'" color="success">Closed</ion-badge>
              </ion-buttons>
            </ion-item>
          </ion-list>
          <ion-note v-else class="empty-note">No stages</ion-note>
        </div>

        <div v-show="activeTab === 'payments'" class="tab-content">
          <div class="tab-actions">
            <ion-button v-if="!isProjectLocked" size="small" @click="handleAddPayment">Add Payment</ion-button>
          </div>
          <div class="payment-summary">
            <span>Paid: {{ formatCurrency(paymentSummary.total_paid || 0) }}</span>
            <span>Remaining: {{ formatCurrency(paymentSummary.remaining || 0) }}</span>
            <span>{{ paymentSummary.payment_percentage || 0 }}%</span>
          </div>
          <ion-list v-if="payments.length" lines="inset">
            <ion-item v-for="p in payments" :key="p.id">
              <ion-label>
                <h2>{{ formatCurrency(p.amount) }}</h2>
                <p>{{ formatDate(p.payment_date) }} · {{ p.stage_title }}</p>
                <p>{{ p.payment_method }} · {{ formatStatus(p.status) }}</p>
              </ion-label>
              <ion-button v-if="p.accounting_transaction_id" slot="end" fill="clear" size="small" @click="$router.push(`/transactions?highlight=${p.accounting_transaction_id}`)">View Txn</ion-button>
            </ion-item>
          </ion-list>
          <ion-note v-else class="empty-note">No payments</ion-note>
        </div>

        <div v-show="activeTab === 'audit'" class="tab-content">
          <AuditTrail :project-id="projectId" />
        </div>
      </template>
      <div v-else class="empty-state">
        <ion-note>Project not found</ion-note>
      </div>
    </ion-content>

    <QuoteForm v-model="quoteFormOpen" :project-id="projectId" :quote="currentQuote" @success="onQuoteSuccess" />
    <QuoteViewModal v-model="quoteViewOpen" :project-id="projectId" :quote-id="currentQuoteId" />
    <QuoteCompareModal v-model="quoteCompareOpen" :project-id="projectId" :project-currency="project.currency || 'USD'" @quote-accepted="onQuoteAccepted" />
    <StageForm v-model="stageFormOpen" :project-id="projectId" :total-amount="project.current_budget || project.total_amount" :stage="currentStage" @success="onStageSuccess" />
    <StagePaymentForm v-model="stagePaymentOpen" :project-id="projectId" :stage="currentStage" :payment-type="stagePaymentType" @success="onStagePaymentSuccess" />
    <PaymentForm v-model="paymentFormOpen" :project-id="projectId" :project-currency="project.currency" @success="onPaymentSuccess" />
    <AdditionalWorkModal v-model="additionalWorkOpen" :project-id="projectId" @success="onAdditionalWorkSuccess" />
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import {
  getProjectById,
  getProjectSummary,
  getQuotes,
  acceptQuote,
  rejectQuote,
  getStages,
  startStage,
  completeStage,
  approveStage,
  getPayments,
  getPaymentSummary
} from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import ProjectOverview from './components/ProjectOverview.vue'
import QuoteForm from './components/QuoteForm.vue'
import QuoteViewModal from './components/QuoteViewModal.vue'
import QuoteCompareModal from './components/QuoteCompareModal.vue'
import StageForm from './components/StageForm.vue'
import StagePaymentForm from './components/StagePaymentForm.vue'
import PaymentForm from './components/PaymentForm.vue'
import AuditTrail from './components/AuditTrail.vue'
import AdditionalWorkModal from './components/AdditionalWorkModal.vue'

const route = useRoute()
const projectId = computed(() => route.params.id)
const project = reactive({})
const summary = reactive({})
const loading = ref(true)
const activeTab = ref('overview')
const defaultCurrency = ref({ code: 'USD' })

const quotes = ref([])
const stages = ref([])
const payments = ref([])
const paymentSummary = ref({})

const quoteFormOpen = ref(false)
const quoteViewOpen = ref(false)
const quoteCompareOpen = ref(false)
const stageFormOpen = ref(false)
const stagePaymentOpen = ref(false)
const paymentFormOpen = ref(false)
const additionalWorkOpen = ref(false)
const currentQuote = ref({})
const currentQuoteId = ref(null)
const currentStage = ref(null)
const stagePaymentType = ref('start')

const isProjectLocked = computed(() => project.status === 'completed' || project.status === 'cancelled')
const hasAcceptedQuote = computed(() => quotes.value.some((q) => q.status === 'accepted'))

function getStatusColor(s) {
  const map = { draft: 'medium', pending_quotes: 'warning', quotes_received: 'warning', vendor_selected: 'primary', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'medium'
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

async function loadDefaultCurrency() {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
}

async function loadProject() {
  const id = projectId.value
  if (!id) return
  try {
    const res = await getProjectById(id)
    const data = res?.data ?? res
    Object.assign(project, data || {})
  } catch (_) {
    Object.assign(project, {})
  }
}

async function loadSummary() {
  const id = projectId.value
  if (!id) return
  try {
    const res = await getProjectSummary(id)
    const data = res?.data ?? res
    Object.assign(summary, data || {})
  } catch (_) {}
}

async function loadQuotes() {
  try {
    const res = await getQuotes(projectId.value)
    quotes.value = res?.data ?? res ?? []
  } catch (_) {
    quotes.value = []
  }
}

async function loadStages() {
  try {
    const res = await getStages(projectId.value)
    stages.value = res?.data ?? res ?? []
  } catch (_) {
    stages.value = []
  }
}

async function loadPayments() {
  try {
    const [payRes, sumRes] = await Promise.all([getPayments(projectId.value), getPaymentSummary(projectId.value)])
    payments.value = payRes?.data ?? payRes ?? []
    paymentSummary.value = sumRes?.data ?? sumRes ?? {}
  } catch (_) {
    payments.value = []
    paymentSummary.value = {}
  }
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadProject(), loadSummary(), loadQuotes(), loadStages(), loadPayments()])
  } finally {
    loading.value = false
  }
}

function handleAddQuote() {
  currentQuote.value = {}
  quoteFormOpen.value = true
}

function handleViewQuote(q) {
  currentQuoteId.value = q.id
  quoteViewOpen.value = true
}

function handleEditQuote(q) {
  currentQuote.value = { ...q }
  quoteFormOpen.value = true
}

function handleCompareQuotes() {
  quoteCompareOpen.value = true
}

async function handleAcceptQuote(q) {
  try {
    await showConfirmDialog({ title: 'Accept Quote', message: `Accept quote from ${q.vendor_name} for ${formatCurrency(q.quoted_amount)}?`, confirmText: 'Accept' })
    await acceptQuote(projectId.value, q.id)
    showToast('Quote accepted')
    loadProject()
    loadQuotes()
    loadSummary()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

async function handleRejectQuote(q) {
  try {
    await showConfirmDialog({ title: 'Reject Quote', message: `Reject quote from ${q.vendor_name}?`, confirmText: 'Reject' })
    await rejectQuote(projectId.value, q.id)
    showToast('Quote rejected')
    loadQuotes()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

function onQuoteSuccess() {
  loadQuotes()
  loadSummary()
}

function onQuoteAccepted() {
  loadProject()
  loadQuotes()
  loadSummary()
}

function handleAddStage() {
  currentStage.value = null
  stageFormOpen.value = true
}

function handleEditStage(s) {
  currentStage.value = { ...s }
  stageFormOpen.value = true
}

function onStageSuccess() {
  loadStages()
  loadSummary()
}

async function handleStartStage(s) {
  try {
    const msg = s.start_payment_amount > 0 ? `Start stage "${s.title}"? Start payment can now be made.` : `Start stage "${s.title}"?`
    await showConfirmDialog({ title: 'Start Stage', message: msg })
    await startStage(projectId.value, s.id)
    showToast('Stage started')
    loadStages()
    loadSummary()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

function handleRecordStartPayment(s) {
  currentStage.value = s
  stagePaymentType.value = 'start'
  stagePaymentOpen.value = true
}

function handleRecordEndPayment(s) {
  currentStage.value = s
  stagePaymentType.value = 'end'
  stagePaymentOpen.value = true
}

async function handleCompleteStage(s) {
  try {
    await showConfirmDialog({ title: 'Complete Stage', message: `Mark stage "${s.title}" as completed?` })
    await completeStage(projectId.value, s.id)
    showToast('Stage completed')
    loadStages()
    loadSummary()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

async function handleApproveStage(s) {
  try {
    const msg = s.end_payment_amount > 0 ? `Approve stage "${s.title}"? End payment can now be made.` : `Approve stage "${s.title}"?`
    await showConfirmDialog({ title: 'Approve Stage', message: msg })
    await approveStage(projectId.value, s.id)
    showToast('Stage approved')
    loadStages()
    loadSummary()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

function onStagePaymentSuccess() {
  loadStages()
  loadPayments()
  loadSummary()
}

function handleAddPayment() {
  paymentFormOpen.value = true
}

function onPaymentSuccess() {
  loadPayments()
  loadStages()
  loadSummary()
}

function handleAddAdditionalWork() {
  additionalWorkOpen.value = true
}

function onAdditionalWorkSuccess() {
  loadProject()
  loadSummary()
}

onMounted(async () => {
  await loadDefaultCurrency()
  await loadAll()
})

watch(() => route.params.id, () => loadAll())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.detail-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
.detail-header h2 { margin: 0; font-size: 18px; }
.progress-cards ion-item { --background: transparent; }
.progress-cards .stat { font-size: 12px; color: var(--ion-color-medium); }
.tab-content { padding: 16px; }
.tab-actions { margin-bottom: 12px; }
.info-note, .empty-note { display: block; padding: 16px; color: var(--ion-color-medium); }
.payment-summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
