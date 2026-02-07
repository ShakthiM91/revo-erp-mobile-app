<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="id ? `/work/vendors` : '/work/vendors'" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Vendor' : 'Add Vendor' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="form.name" placeholder="Vendor name" />
          </ion-item>
          <ion-item button detail @click="showCategoryPicker = true">
            <ion-label position="stacked">Category</ion-label>
            <ion-note slot="end">{{ categoryName || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Contact Person</ion-label>
            <ion-input v-model="form.contact_person" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="form.email" type="email" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Phone</ion-label>
            <ion-input v-model="form.phone" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Address</ion-label>
            <ion-textarea v-model="form.address" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea v-model="form.notes" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item v-if="isEdit" button detail @click="showActivePicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ form.is_active ? 'Active' : 'Inactive' }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showCategoryPicker" @didDismiss="showCategoryPicker = false">
        <ion-header><ion-toolbar><ion-title>Category</ion-title><ion-buttons slot="end"><ion-button @click="showCategoryPicker = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in categories" :key="c.id" button @click="form.category_id = c.id; showCategoryPicker = false"><ion-label>{{ c.name }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
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
import { createVendor, updateVendor, getVendorById, getVendorCategories } from '@/api/work'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = computed(() => !!id)

const saving = ref(false)
const showCategoryPicker = ref(false)
const showActivePicker = ref(false)
const categories = ref([])

const form = reactive({
  name: '',
  category_id: null,
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  is_active: true
})

const categoryName = computed(() => {
  const c = categories.value.find(x => x.id === form.category_id)
  return c?.name || ''
})

async function loadCategories() {
  try {
    const res = await getVendorCategories({ is_active: true })
    const data = res?.data ?? res ?? []
    categories.value = Array.isArray(data) ? data : []
  } catch (_) {
    categories.value = []
  }
}

async function loadVendor() {
  if (!id) return
  try {
    const res = await getVendorById(id)
    const v = res?.data ?? res
    if (v) {
      form.name = v.name || ''
      form.category_id = v.category_id ?? null
      form.contact_person = v.contact_person || ''
      form.email = v.email || ''
      form.phone = v.phone || ''
      form.address = v.address || ''
      form.notes = v.notes || ''
      form.is_active = v.is_active !== false
    }
  } catch (e) {
    showToast('Failed to load')
    router.back()
  }
}

onMounted(async () => {
  await loadCategories()
  if (id) await loadVendor()
})

watch(() => route.params.id, (newId) => {
  if (newId) loadVendor()
})

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter vendor name')
    return
  }
  if (!form.category_id) {
    showToast('Select a category')
    return
  }
  saving.value = true
  try {
    const data = {
      name,
      category_id: form.category_id,
      contact_person: form.contact_person?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      notes: form.notes?.trim() || null,
      is_active: form.is_active
    }
    if (id) {
      await updateVendor(id, data)
    } else {
      await createVendor(data)
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
