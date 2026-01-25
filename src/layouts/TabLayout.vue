<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar v-if="showTabbar" slot="bottom">
        <ion-tab-button tab="dashboard" href="/dashboard">
          <ion-icon :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="transactions" href="/transactions">
          <ion-icon :icon="walletOutline" />
          <ion-label>Finance</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="assets" href="/assets">
          <ion-icon :icon="cubeOutline" />
          <ion-label>Assets</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="schedule" href="/schedule">
          <ion-icon :icon="calendarOutline" />
          <ion-label>Schedule</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="me" href="/me">
          <ion-icon :icon="personOutline" />
          <ion-label>Me</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/vue'
import {
  homeOutline,
  walletOutline,
  cubeOutline,
  calendarOutline,
  personOutline
} from 'ionicons/icons'

const route = useRoute()
const showTabbar = computed(() => route.meta?.showTabbar !== false)
</script>
