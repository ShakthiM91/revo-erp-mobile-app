<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Asset' : 'Add Asset' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Asset Number</ion-label>
            <ion-input v-model="form.asset_number" placeholder="Number" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="form.name" placeholder="Name" />
          </ion-item>
          <ion-item button detail @click="showCategoryPicker = true">
            <ion-label position="stacked">Category</ion-label>
            <ion-note slot="end">{{ categoryText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" rows="2" />
          </ion-item>
          <ion-item button detail @click="showDatePicker = true">
            <ion-label position="stacked">Purchase Date</ion-label>
            <ion-note slot="end">{{ dateText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Purchase Value</ion-label>
            <ion-input v-model.number="form.purchase_value" type="number" inputmode="decimal" placeholder="0" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Current Value</ion-label>
            <ion-input v-model.number="form.current_value" type="number" inputmode="decimal" placeholder="0" />
          </ion-item>
          <ion-item button detail @click="showCurrencyPicker = true">
            <ion-label position="stacked">Currency</ion-label>
            <ion-note slot="end">{{ currencyText }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Location</ion-label>
            <ion-input v-model="form.location" placeholder="Optional" />
          </ion-item>
          <ion-item button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ statusText }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showCategoryPicker" @didDismiss="showCategoryPicker = false">
        <ion-header><ion-toolbar><ion-title>Category</ion-title><ion-buttons slot="end"><ion-button @click="showCategoryPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in categoryCols" :key="c.value" button @click="form.category = c.value; showCategoryPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showCurrencyPicker" @didDismiss="showCurrencyPicker = false">
        <ion-header><ion-toolbar><ion-title>Currency</ion-title><ion-buttons slot="end"><ion-button @click="showCurrencyPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in currencyCols" :key="c.value" button @click="form.currency = c.value; showCurrencyPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showStatusPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="s in statusCols" :key="s.value" button @click="form.status = s.value; showStatusPicker = false"><ion-label>{{ s.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showDatePicker" @didDismiss="showDatePicker = false">
        <ion-header><ion-toolbar><ion-title>Purchase Date</ion-title><ion-buttons slot="end"><ion-button @click="showDatePicker = false">OK</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-datetime
            presentation="date"
            :value="form.purchase_date"
            @ionChange="(e) => { const v = e.detail.value; if (v) form.purchase_date = v.slice(0, 10) }"
          />
        </ion-content>
      </ion-modal>
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
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonModal,
  IonDatetime
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createAsset, updateAsset, getAssetById, getAssetCategories } from '@/api/asset'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = !!id

const form = reactive({
  asset_number: '',
  name: '',
  category: '',
  description: '',
  purchase_date: '',
  purchase_value: '',
  current_value: '',
  currency: 'USD',
  location: '',
  status: 'available'
})

const categoryOptions = ref([])
const saving = ref(false)
const showCategoryPicker = ref(false)
const showCurrencyPicker = ref(false)
const showStatusPicker = ref(false)
const showDatePicker = ref(false)

const categoryCols = computed(() => categoryOptions.value.map(c => ({ text: c.name || c, value: c.name || c })))
const currencyCols = [{ text: 'USD', value: 'USD' }, { text: 'EUR', value: 'EUR' }, { text: 'GBP', value: 'GBP' }]
const statusCols = [{ text: 'Available', value: 'available' }, { text: 'Assigned', value: 'assigned' }, { text: 'Maintenance', value: 'maintenance' }]

const categoryText = computed(() => form.category || '')
const currencyText = computed(() => form.currency || 'USD')
const statusText = computed(() => statusCols.find(s => s.value === form.status)?.text || form.status)
const dateText = computed(() => form.purchase_date || '')

function flatten (arr, out = []) {
  for (const c of arr || []) {
    out.push({ name: c.name || c })
    if (c.children?.length) flatten(c.children, out)
  }
  return out
}

async function loadCategories () {
  try {
    const r = await getAssetCategories()
    const data = r?.data || []
    categoryOptions.value = (data[0] && data[0].children !== undefined) ? flatten(data) : data.map(c => (typeof c === 'string' ? { name: c } : { name: c.name }))
  } catch (_) { categoryOptions.value = [] }
}

async function loadEdit () {
  if (!id) return
  try {
    const r = await getAssetById(id)
    const a = r?.data || r
    if (a) {
      form.asset_number = a.asset_number || ''
      form.name = a.name || ''
      form.category = a.category || ''
      form.description = a.description || ''
      form.purchase_date = a.purchase_date ? new Date(a.purchase_date).toISOString().split('T')[0] : ''
      form.purchase_value = a.purchase_value ?? ''
      form.current_value = a.current_value ?? ''
      form.currency = a.currency || 'USD'
      form.location = a.location || ''
      form.status = a.status || 'available'
    }
  } catch (e) { showToast('Failed to load'); router.back() }
}

async function submit () {
  if (!form.asset_number || !form.name || !form.category) { showToast('Fill required fields'); return }
  saving.value = true
  try {
    const body = {
      asset_number: form.asset_number,
      name: form.name,
      category: form.category,
      description: form.description || null,
      purchase_date: form.purchase_date || null,
      purchase_value: parseFloat(form.purchase_value) || 0,
      current_value: parseFloat(form.current_value) || 0,
      currency: form.currency,
      location: form.location || null,
      status: form.status
    }
    if (isEdit) await updateAsset(id, body)
    else await createAsset(body)
    showToast(isEdit ? 'Updated' : 'Created')
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(async () => {
  await loadCategories()
  if (isEdit) await loadEdit()
  else form.asset_number = `AST-${Date.now()}`
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
