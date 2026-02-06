<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button @click="$emit('update:modelValue', false)">Cancel</ion-button></ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Stage' : 'Add Stage' }}</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="saving" @click="submit">Save</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item>
          <ion-label position="stacked">Title</ion-label>
          <ion-input v-model="form.title" placeholder="Stage title" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea v-model="form.description" :rows="2" placeholder="Optional" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Sequence Order</ion-label>
          <ion-input v-model.number="form.sequence_order" type="number" min="1" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Start Payment Amount</ion-label>
          <ion-input v-model.number="form.start_payment_amount" type="number" step="0.01" min="0" placeholder="0" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">End Payment Amount</ion-label>
          <ion-input v-model.number="form.end_payment_amount" type="number" step="0.01" min="0" placeholder="0" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Expected Date</ion-label>
          <ion-input v-model="form.expected_date" type="date" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Notes</ion-label>
          <ion-textarea v-model="form.notes" :rows="2" placeholder="Optional" />
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/vue'
import { createStage, updateStage } from '@/api/work'
import { showToast } from '@/utils/ionicFeedback'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  totalAmount: { type: Number, default: 0 },
  stage: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  sequence_order: 1,
  start_payment_amount: 0,
  end_payment_amount: 0,
  expected_date: '',
  notes: ''
})

const isEdit = computed(() => !!props.stage?.id)

function resetForm() {
  if (props.stage?.id) {
    form.value = {
      title: props.stage.title || '',
      description: props.stage.description || '',
      sequence_order: props.stage.sequence_order || 1,
      start_payment_amount: parseFloat(props.stage.start_payment_amount) || 0,
      end_payment_amount: parseFloat(props.stage.end_payment_amount) || 0,
      expected_date: props.stage.expected_date || '',
      notes: props.stage.notes || ''
    }
  } else {
    form.value = { title: '', description: '', sequence_order: 1, start_payment_amount: 0, end_payment_amount: 0, expected_date: '', notes: '' }
  }
}

async function submit() {
  if (!(form.value.title || '').trim()) {
    showToast('Title required')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateStage(props.projectId, props.stage.id, form.value)
      showToast('Stage updated')
    } else {
      await createStage(props.projectId, form.value)
      showToast('Stage created')
    }
    emit('success')
    emit('update:modelValue', false)
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) resetForm()
})

watch(() => props.stage, () => {
  if (props.modelValue) resetForm()
}, { deep: true })
</script>
