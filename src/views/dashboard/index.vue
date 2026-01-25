<template>
  <ion-page>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <div class="dashboard">
        <ion-grid class="stat-grid">
          <ion-row>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/members')">
                <ion-icon :icon="peopleOutline" class="stat-icon" />
                <div class="grid-label">Total Members</div>
                <div class="grid-value">{{ statistics.totalMembers }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/members')">
                <ion-icon :icon="personOutline" class="stat-icon" />
                <div class="grid-label">Active Members</div>
                <div class="grid-value">{{ statistics.activeMembers }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/assets')">
                <ion-icon :icon="cubeOutline" class="stat-icon" />
                <div class="grid-label">Total Assets</div>
                <div class="grid-value">{{ statistics.totalAssets }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/schedule')">
                <ion-icon :icon="calendarOutline" class="stat-icon" />
                <div class="grid-label">Upcoming Events</div>
                <div class="grid-value">{{ statistics.upcomingEvents }}</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IonPage, IonContent, IonRefresher, IonRefresherContent, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/vue'
import { peopleOutline, personOutline, cubeOutline, calendarOutline } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { getMemberStatistics } from '@/api/member'
import { getAssets } from '@/api/asset'
import { getUpcomingEvents } from '@/api/schedule'

const statistics = ref({
  totalMembers: 0,
  activeMembers: 0,
  totalAssets: 0,
  upcomingEvents: 0
})

const fetchStatistics = async () => {
  try {
    const memberRes = await getMemberStatistics()
    if (memberRes?.success && memberRes?.data) {
      statistics.value.totalMembers = memberRes.data.total_members ?? 0
      statistics.value.activeMembers = memberRes.data.active_members ?? 0
    }
    try {
      const assetsRes = await getAssets({ limit: 500 })
      statistics.value.totalAssets = (assetsRes?.data || []).length
    } catch {
      statistics.value.totalAssets = 0
    }
    try {
      const eventsRes = await getUpcomingEvents(20)
      statistics.value.upcomingEvents = (eventsRes?.data || []).length
    } catch {
      statistics.value.upcomingEvents = 0
    }
  } catch (e) {
    console.error('Dashboard fetch error:', e)
    showToast('Failed to load dashboard')
  }
}

const onRefresh = async (ev) => {
  await fetchStatistics()
  ev.target.complete()
}

onMounted(() => fetchStatistics())
</script>

<style scoped>
.dashboard {
  padding: 16px;
  min-height: 100%;
  background: #f7f8fa;
}
.stat-grid ion-col { padding: 8px; }
.stat-card {
  padding: 16px 8px;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.stat-icon { font-size: 28px; color: var(--ion-color-primary); margin-bottom: 8px; }
.grid-label { font-size: 12px; color: #969799; margin-bottom: 4px; }
.grid-value { font-size: 20px; font-weight: 700; color: #323233; }
</style>
