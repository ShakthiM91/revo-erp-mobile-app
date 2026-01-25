<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Reports</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item button detail @click="onReport('income-expense')">
          <ion-label>Income vs Expense</ion-label>
        </ion-item>
        <ion-item button detail @click="onReport('assets')">
          <ion-label>Assets Summary</ion-label>
        </ion-item>
      </ion-list>
      <ion-item-divider>More reports in web admin</ion-item-divider>
    </ion-content>
  </ion-page>
</template>

<script setup>
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
  IonItemDivider
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'

function onReport () {
  showToast('Coming soon')
}
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
