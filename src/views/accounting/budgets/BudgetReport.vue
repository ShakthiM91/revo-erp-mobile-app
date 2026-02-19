<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Budget Report</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>
      <template v-else-if="report">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ report.period_start }} to {{ report.period_end }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Budget: {{ formatCurrency(report.totalBudget) }}</p>
            <p>Actual: {{ formatCurrency(report.totalActual) }}</p>
            <p>
              Variance:
              <span :class="(report.variance || 0) >= 0 ? 'success' : 'danger'">
                {{ formatCurrency(report.variance) }}
              </span>
            </p>
          </ion-card-content>
        </ion-card>
        <ion-list v-if="report.items?.length">
          <ion-item v-for="item in report.items" :key="item.category_id">
            <ion-label>
              <h2>{{ item.category_name }}</h2>
              <p>{{ formatCurrency(item.budget) }} / {{ formatCurrency(item.actual) }}</p>
            </ion-label>
            <ion-note slot="end" :class="(item.variance || 0) >= 0 ? 'success' : 'danger'">
              {{ formatCurrency(item.variance) }}
            </ion-note>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getBudgetById, getBudgetPeriods, getBudgetPeriodReport } from '@/api/accounting'

const route = useRoute()
const planId = computed(() => route.params.id)
const loading = ref(false)
const report = ref(null)
const periods = ref([])
const currentPeriodIndex = ref(0)

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)

async function load() {
  if (!planId.value) return
  loading.value = true
  try {
    const periodsRes = await getBudgetPeriods(planId.value)
    periods.value = periodsRes?.data || []
    const idx = periods.value.length > 0 ? Math.min(currentPeriodIndex.value, periods.value.length - 1) : 0
    const reportRes = await getBudgetPeriodReport(planId.value, idx)
    report.value = reportRes?.data || null
  } catch (e) {
    showToast('Failed to load report')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.success { color: var(--ion-color-success); }
.danger { color: var(--ion-color-danger); }
</style>
