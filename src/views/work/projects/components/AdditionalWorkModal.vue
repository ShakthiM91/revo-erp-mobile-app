<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button @click="$emit('update:modelValue', false)">Cancel</ion-button></ion-buttons>
        <ion-title>Add Additional Work</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="saving" @click="submit">Add</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item>
          <ion-label position="stacked">Additional Amount</ion-label>
          <ion-input v-model.number="form.additional_amount" type="number" step="0.01" min="0" placeholder="0" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Reason</ion-label>
          <ion-textarea v-model="form.reason" :rows="3" placeholder="Explain why additional work is needed" />
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/vue'
import { addAdditionalWork } from '@/api/work'
import { showToast } from '@/utils/ionicFeedback'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true }
})

const emit = defineEmits(['update:modelValue', 'success'])

const saving = ref(false)
const form = ref({ additional_amount: 0, reason: '' })

async function submit() {
  if (!form.value.additional_amount || form.value.additional_amount <= 0) {
    showToast('Amount required')
    return
  }
  if (!(form.value.reason || '').trim()) {
    showToast('Reason required')
    return
  }
  saving.value = true
  try {
    await addAdditionalWork(props.projectId, {
      additional_amount: form.value.additional_amount,
      reason: form.value.reason.trim()
    })
    showToast('Additional work added')
    emit('success')
    emit('update:modelValue', false)
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) form.value = { additional_amount: 0, reason: '' }
})
</script>
