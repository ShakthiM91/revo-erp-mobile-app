<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/work" />
        </ion-buttons>
        <ion-title>Vendor Categories</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openForm()">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-list v-else-if="list.length" lines="inset">
        <ion-item-sliding v-for="row in list" :key="row.id">
          <ion-item button @click="openForm(row)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ row.description || '-' }}</p>
            </ion-label>
            <ion-badge color="medium" slot="end">{{ row.vendor_count || 0 }} vendors</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option @click="openForm(row)">Edit</ion-item-option>
            <ion-item-option color="danger" :disabled="(row.vendor_count || 0) > 0" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else class="empty-state">
        <ion-note>No categories</ion-note>
      </div>
    </ion-content>

    <ion-modal :is-open="formOpen" @didDismiss="formOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="formOpen = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>{{ current?.id ? 'Edit Category' : 'Add Category' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button :disabled="saving" @click="submit">Save</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="form.name" placeholder="Category name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item v-if="current?.id" button detail @click="showActivePicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ form.is_active ? 'Active' : 'Inactive' }}</ion-note>
          </ion-item>
        </ion-list>
        <ion-modal :is-open="showActivePicker" @didDismiss="showActivePicker = false">
          <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showActivePicker = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header>
          <ion-content>
            <ion-list>
              <ion-item button @click="form.is_active = true; showActivePicker = false"><ion-label>Active</ion-label></ion-item>
              <ion-item button @click="form.is_active = false; showActivePicker = false"><ion-label>Inactive</ion-label></ion-item>
            </ion-list>
          </ion-content>
        </ion-modal>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonBadge,
  IonSpinner,
  IonModal
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import {
  getVendorCategories,
  createVendorCategory,
  updateVendorCategory,
  deleteVendorCategory
} from '@/api/work'

const list = ref([])
const loading = ref(false)
const formOpen = ref(false)
const current = ref(null)
const saving = ref(false)
const showActivePicker = ref(false)

const form = reactive({
  name: '',
  description: '',
  is_active: true
})

function resetForm() {
  if (current.value?.id) {
    form.name = current.value.name || ''
    form.description = current.value.description || ''
    form.is_active = current.value.is_active !== false
  } else {
    form.name = ''
    form.description = ''
    form.is_active = true
  }
}

watch(formOpen, (open) => {
  if (open) resetForm()
})

async function load() {
  loading.value = true
  try {
    const res = await getVendorCategories()
    const data = res?.data ?? res ?? []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast('Failed to load')
    list.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function openForm(cat = null) {
  current.value = cat ? { ...cat } : null
  formOpen.value = true
}

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter category name')
    return
  }
  saving.value = true
  try {
    const data = {
      name,
      description: form.description?.trim() || null,
      is_active: form.is_active
    }
    if (current.value?.id) {
      await updateVendorCategory(current.value.id, data)
    } else {
      await createVendorCategory(data)
    }
    formOpen.value = false
    showToast(current.value?.id ? 'Updated' : 'Created')
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if ((row.vendor_count || 0) > 0) {
    showToast('Category has vendors')
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    await deleteVendorCategory(row.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
