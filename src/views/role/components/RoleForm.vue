<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ role ? 'Edit Role' : 'Create Role' }}</ion-title>
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
            <ion-input v-model="form.name" placeholder="Enter role name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="3" />
          </ion-item>
          <ion-item button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ statusText }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Status</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showStatusPicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="s in statusOptions" :key="s.value" button @click="form.status = s.value; showStatusPicker = false">
              <ion-label>{{ s.text }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createRole, updateRole } from '@/api/role'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  role: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const saving = ref(false)
const showStatusPicker = ref(false)

const statusOptions = [
  { text: 'Active', value: 'active' },
  { text: 'Inactive', value: 'inactive' }
]

const form = reactive({
  name: '',
  description: '',
  status: 'active'
})

const statusText = computed(() => statusOptions.find(s => s.value === form.status)?.text || 'Active')

function resetForm() {
  if (props.role) {
    form.name = props.role.name || ''
    form.description = props.role.description || ''
    form.status = props.role.status || 'active'
  } else {
    form.name = ''
    form.description = ''
    form.status = 'active'
  }
}

watch(
  () => [props.isOpen, props.role],
  ([open]) => {
    if (open) resetForm()
  },
  { immediate: true }
)

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter role name')
    return
  }
  if (name.length < 2 || name.length > 255) {
    showToast('Name should be 2–255 characters')
    return
  }
  saving.value = true
  try {
    const data = {
      name,
      description: form.description?.trim() || null,
      status: form.status
    }
    const res = props.role ? await updateRole(props.role.id, data) : await createRole(data)
    if (res?.queued) showToast('Saved locally. Will sync when online.')
    emit('success')
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
