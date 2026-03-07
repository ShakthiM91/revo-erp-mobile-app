<template>
  <div class="settings-content">
    <ion-spinner v-if="loading" name="crescent" class="spinner" />
    <template v-else>
      <ion-card v-if="defaultCurrency">
        <ion-card-header>
          <ion-card-title>Default Currency</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ defaultCurrency.code }} - {{ defaultCurrency.name }}</p>
        </ion-card-content>
      </ion-card>
      <ion-note v-else class="hint">No default currency set</ion-note>

      <ion-list lines="inset">
        <ion-item-divider>Enabled Currencies</ion-item-divider>
        <ion-item-sliding v-for="c in enabledCurrencies" :key="c.id">
          <ion-item>
            <ion-label>
              <h2>{{ c.code }}</h2>
              <p>{{ c.name }} · {{ c.symbol }}</p>
            </ion-label>
            <ion-badge v-if="c.is_default" color="success" slot="end">Default</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option v-if="!c.is_default" @click="setDefault(c)">Set Default</ion-item-option>
            <ion-item-option v-if="!c.is_default" color="danger" @click="disableCurrency(c)">Disable</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-list v-if="availableCurrencies.length" lines="inset">
        <ion-item-divider>Available to Enable</ion-item-divider>
        <ion-item v-for="c in availableCurrencies" :key="c.id" button @click="enableCurrency(c)">
          <ion-label>
            <h2>{{ c.code }}</h2>
            <p>{{ c.name }}</p>
          </ion-label>
          <ion-note slot="end">Enable</ion-note>
        </ion-item>
      </ion-list>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonItemDivider,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonNote,
  IonSpinner
} from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import request from '@/utils/request'
import {
  getTenantCurrencies,
  getTenantDefaultCurrency,
  enableCurrencyForTenant,
  disableCurrencyForTenant,
  setDefaultCurrencyForTenant
} from '@/api/currency'

const loading = ref(false)
const enabledCurrencies = ref([])
const allCurrencies = ref([])
const defaultCurrency = ref(null)

const availableCurrencies = computed(() => {
  const enabledIds = new Set(enabledCurrencies.value.map(c => c.id))
  return allCurrencies.value.filter(c => !enabledIds.has(c.id) && c.is_active !== false)
})

async function load() {
  loading.value = true
  try {
    const [enabledRes, defaultRes] = await Promise.all([
      getTenantCurrencies(),
      getTenantDefaultCurrency()
    ])
    const enabledData = enabledRes?.data ?? enabledRes
    enabledCurrencies.value = Array.isArray(enabledData) ? enabledData : (enabledData?.data || [])
    const defaultData = defaultRes?.data ?? defaultRes
    defaultCurrency.value = defaultData?.data ?? defaultData ?? null

    try {
      const allRes = await request({ url: '/api/currencies', method: 'get', params: { is_active: 1 } })
      const allData = allRes?.data ?? allRes
      allCurrencies.value = Array.isArray(allData) ? allData : (allData?.data || [])
    } catch (_) {
      allCurrencies.value = []
    }
  } catch (e) {
    showToast('Failed to load')
    enabledCurrencies.value = []
    defaultCurrency.value = null
  } finally {
    loading.value = false
  }
}

async function enableCurrency(c) {
  try {
    await enableCurrencyForTenant({ currency_id: c.id })
    showToast(`${c.code} enabled`)
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  }
}

async function disableCurrency(c) {
  try {
    await showConfirmDialog({ title: 'Disable', message: `Disable ${c.code}?` })
    await disableCurrencyForTenant(c.id)
    showToast('Disabled')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

async function setDefault(c) {
  try {
    await setDefaultCurrencyForTenant(c.id)
    showToast(`Default set to ${c.code}`)
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  }
}

onMounted(() => load())
</script>

<style scoped>
.settings-content { padding: 16px; }
.spinner { margin: 48px auto; display: block; }
.hint { display: block; padding: 16px; color: var(--ion-color-warning); }
</style>
