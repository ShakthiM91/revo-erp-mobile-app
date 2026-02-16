<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Event' : 'Add Event' }}</ion-title>
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
            <ion-input v-model="form.title" placeholder="Event title" />
          </ion-item>
          <ion-item button detail @click="showTypePicker = true">
            <ion-label position="stacked">Type</ion-label>
            <ion-note slot="end">{{ typeText }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" rows="2" />
          </ion-item>
          <ion-item button detail @click="showStartPicker = true">
            <ion-label position="stacked">Start</ion-label>
            <ion-note slot="end">{{ startText }}</ion-note>
          </ion-item>
          <ion-item button detail @click="showEndPicker = true">
            <ion-label position="stacked">End</ion-label>
            <ion-note slot="end">{{ endText }}</ion-note>
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

      <ion-modal :is-open="showTypePicker" @didDismiss="showTypePicker = false">
        <ion-header><ion-toolbar><ion-title>Type</ion-title><ion-buttons slot="end"><ion-button @click="showTypePicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in typeCols" :key="c.value" button @click="form.type = c.value; showTypePicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showStatusPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in statusCols" :key="c.value" button @click="form.status = c.value; showStatusPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showStartPicker" @didDismiss="showStartPicker = false">
        <ion-header><ion-toolbar><ion-title>Start</ion-title><ion-buttons slot="end"><ion-button @click="showStartPicker = false">OK</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-datetime
            presentation="date-time"
            :min="minDate"
            :max="maxDate"
            :value="form.start_time ? form.start_time.replace(' ', 'T').slice(0, 19) : null"
            @ionChange="(e) => { const v = e.detail.value; if (v) form.start_time = v.slice(0, 19).replace('T', ' ') }"
          />
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showEndPicker" @didDismiss="showEndPicker = false">
        <ion-header><ion-toolbar><ion-title>End</ion-title><ion-buttons slot="end"><ion-button @click="showEndPicker = false">OK</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-datetime
            presentation="date-time"
            :min="minDate"
            :max="maxDate"
            :value="form.end_time ? form.end_time.replace(' ', 'T').slice(0, 19) : null"
            @ionChange="(e) => { const v = e.detail.value; if (v) form.end_time = v.slice(0, 19).replace('T', ' ') }"
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
import { createEvent, updateEvent, getEventById } from '@/api/schedule'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = !!id

const form = reactive({
  title: '',
  type: 'meeting',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  status: 'scheduled'
})

const typeCols = [{ text: 'Meeting', value: 'meeting' }, { text: 'Task', value: 'task' }, { text: 'Renewal', value: 'renewal' }]
const statusCols = [{ text: 'Scheduled', value: 'scheduled' }, { text: 'Completed', value: 'completed' }, { text: 'Cancelled', value: 'cancelled' }]

const minDate = new Date(2020, 0, 1).toISOString()
const maxDate = new Date(2030, 11, 31).toISOString()

const saving = ref(false)
const showTypePicker = ref(false)
const showStatusPicker = ref(false)
const showStartPicker = ref(false)
const showEndPicker = ref(false)

const typeText = computed(() => typeCols.find(c => c.value === form.type)?.text || form.type)
const statusText = computed(() => statusCols.find(c => c.value === form.status)?.text || form.status)

function fmt (d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  const h = String(x.getHours()).padStart(2, '0')
  const min = String(x.getMinutes()).padStart(2, '0')
  const s = String(x.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

const startText = computed(() => fmt(form.start_time))
const endText = computed(() => fmt(form.end_time))

async function loadEdit () {
  if (!id) return
  try {
    const r = await getEventById(id)
    const e = r?.data || r
    if (e) {
      form.title = e.title || ''
      form.type = e.type || 'meeting'
      form.description = e.description || ''
      form.start_time = e.start_time || ''
      form.end_time = e.end_time || ''
      form.location = e.location || ''
      form.status = e.status || 'scheduled'
    }
  } catch (err) { showToast('Failed to load'); router.back() }
}

async function submit () {
  if (!form.title || !form.start_time || !form.end_time) { showToast('Fill required fields'); return }
  saving.value = true
  try {
    const body = {
      title: form.title,
      type: form.type,
      description: form.description || null,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || null,
      status: form.status
    }
    const res = isEdit ? await updateEvent(id, body) : await createEvent(body)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : (isEdit ? 'Updated' : 'Created'))
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(async () => {
  if (isEdit) await loadEdit()
  else {
    const n = new Date()
    form.start_time = fmt(n)
    form.end_time = fmt(new Date(n.getTime() + 3600000))
  }
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
