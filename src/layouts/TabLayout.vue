<template>
  <ion-page>
    <ion-header v-if="!isLogin && showLayoutHeader">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button v-if="backHref" :default-href="backHref" />
          <ion-menu-toggle v-else>
            <ion-button>
              <ion-icon :icon="menuOutline" />
            </ion-button>
          </ion-menu-toggle>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            v-for="(btn, i) in headerEndButtons"
            :key="i"
            fill="clear"
            @click="btn.to && router.push(btn.to)"
          >
            <ion-icon :icon="btn.icon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
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
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonMenuToggle,
  IonButton,
  IonTitle,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/vue'
import {
  menuOutline,
  homeOutline,
  walletOutline,
  cubeOutline,
  calendarOutline,
  personOutline,
  addOutline
} from 'ionicons/icons'

const ICON_MAP = { add: addOutline }

const route = useRoute()
const router = useRouter()
const showTabbar = computed(() => route.meta?.showTabbar !== false)
const showLayoutHeader = computed(() => route.meta?.showLayoutHeader !== false)
const isLogin = computed(() => route.path === '/login')
const pageTitle = computed(() => route.meta?.title || 'Revo ERP')
const backHref = computed(() => route.meta?.backHref)
const headerEndButtons = computed(() => {
  const end = route.meta?.headerEnd
  if (!end) return []
  const arr = Array.isArray(end) ? end : [end]
  return arr.map(b => ({
    ...b,
    icon: typeof b.icon === 'string' ? ICON_MAP[b.icon] || addOutline : b.icon
  }))
})
</script>
