<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-toggle>
            <ion-button>
              <ion-icon :icon="menuOutline" />
            </ion-button>
          </ion-menu-toggle>
        </ion-buttons>
        <ion-title>Budgets</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/budgets/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="!loading && list.length > 0" lines="inset">
        <ion-item
          v-for="row in list"
          :key="row.id"
          button
          @click="$router.push(`/budgets/${row.id}/report`)"
        >
          <ion-label>
            <h2>{{ row.name }}</h2>
            <p>{{ row.start_date }} to {{ row.end_date }} · {{ row.period_type }}</p>
          </ion-label>
          <ion-badge :color="statusColor(row.status)" slot="end">{{ row.status }}</ion-badge>
        </ion-item>
      </ion-list>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No budget plans</ion-note>
        <ion-button fill="outline" size="small" @click="$router.push('/budgets/create')">Create one</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuToggle,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { getBudgets } from '@/api/accounting'

const list = ref([])
const loading = ref(false)

function statusColor(s) {
  const t = { active: 'success', abandoned: 'warning', completed: 'medium' }
  return t[s] || 'medium'
}

async function load() {
  loading.value = true
  try {
    const res = await getBudgets()
    list.value = res?.data || []
  } catch (e) {
    showToast('Failed to load budgets')
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

onMounted(load)
</script>

<style scoped>
.empty-state {
  padding: 40px 20px;
  text-align: center;
}
.empty-state ion-note {
  display: block;
  margin-bottom: 16px;
}
</style>
