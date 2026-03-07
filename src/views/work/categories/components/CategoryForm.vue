<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/work/categories" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Category' : 'Add Category' }}</ion-title>
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
            <ion-input v-model="form.name" placeholder="Category name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item v-if="isEdit" button detail @click="showActivePicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ form.is_active ? 'Active' : 'Inactive' }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <StatusPickerModal v-model="showActivePicker" @select="form.is_active = $event" />
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
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createVendorCategory, updateVendorCategory, getVendorCategoryById } from '@/api/work'
import StatusPickerModal from './StatusPickerModal.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value)

const saving = ref(false)
const showActivePicker = ref(false)

const form = reactive({
  name: '',
  description: '',
  is_active: true
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.is_active = true
}

async function loadCategory() {
  if (!id.value) return
  try {
    const res = await getVendorCategoryById(id.value)
    const cat = res?.data ?? res
    if (cat) {
      form.name = cat.name || ''
      form.description = cat.description || ''
      form.is_active = cat.is_active !== false
    }
  } catch (_) {
    showToast('Failed to load category')
  }
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
    const res = isEdit.value ? await updateVendorCategory(id.value, data) : await createVendorCategory(data)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : (isEdit.value ? 'Updated' : 'Created'))
    router.push('/work/categories')
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadCategory()
  else resetForm()
})

watch(id, (newId) => {
  if (newId) loadCategory()
  else resetForm()
})
</script>
