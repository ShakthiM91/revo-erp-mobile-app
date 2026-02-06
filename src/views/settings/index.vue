<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/me" />
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="activeTab" @ionChange="onTabChange">
          <ion-segment-button value="system">System</ion-segment-button>
          <ion-segment-button value="currency">Currency</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <SystemSettings v-if="activeTab === 'system'" />
      <CurrencySettings v-else-if="activeTab === 'currency'" />
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
  IonSegment,
  IonSegmentButton,
  IonContent
} from '@ionic/vue'
import SystemSettings from './components/SystemSettings.vue'
import CurrencySettings from './components/CurrencySettings.vue'

const activeTab = ref('system')

function onTabChange() {}
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
