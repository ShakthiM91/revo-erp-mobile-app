<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/me" />
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item button detail @click="showSys = true">
          <ion-label>System Settings</ion-label>
        </ion-item>
        <ion-item disabled>
          <ion-label>Currency</ion-label>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="showSys" @didDismiss="showSys = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>System Settings</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showSys = false">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="popup-inner">
            <p class="hint">Manage system and tenant options. Full settings are available in the web admin.</p>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonButton
} from '@ionic/vue'

const showSys = ref(false)
</script>

<style scoped>
ion-content {
  --background: #f7f8fa;
}
.popup-inner { padding: 16px 0; }
.hint { font-size: 13px; color: #969799; margin: 0; }
</style>
