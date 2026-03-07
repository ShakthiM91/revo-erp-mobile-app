<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-title>Status</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('update:modelValue', false)">Done</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item button @click="$emit('select', true); $emit('update:modelValue', false)">
          <ion-label>Active</ion-label>
        </ion-item>
        <ion-item button @click="$emit('select', false); $emit('update:modelValue', false)">
          <ion-label>Inactive</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue'

defineProps({
  modelValue: { type: Boolean, required: true }
})

defineEmits(['update:modelValue', 'select'])
</script>
