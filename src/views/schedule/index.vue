<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Schedule</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/schedule/events/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-datetime
        presentation="date"
        :min="minDate"
        :max="maxDate"
        @ionChange="onSelectDay($event)"
      />
      <ion-list class="events-link" lines="inset">
        <ion-item button detail @click="$router.push('/schedule/events')">
          <ion-label>All Events</ion-label>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="showDayPopup" @didDismiss="showDayPopup = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ selectedDayText }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDayPopup = false">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list v-if="dayEvents.length" lines="inset">
            <ion-item v-for="e in dayEvents" :key="e.id" button @click="$router.push(`/schedule/events/${e.id}`); showDayPopup = false">
              <ion-label>
                <h2>{{ e.title }}</h2>
                <p>{{ e.type }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
          <div v-else class="empty-day"><ion-note>No events</ion-note></div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonNote
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { getCalendarEvents } from '@/api/schedule'

const calendarEvents = ref([])
const currentMonth = ref(new Date())
const selectedDay = ref(null)
const showDayPopup = ref(false)

const minDate = new Date(new Date().getFullYear() - 1, 0, 1).toISOString()
const maxDate = new Date(new Date().getFullYear() + 1, 11, 31).toISOString()

const selectedDayText = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(selectedDay.value).toLocaleDateString()
})

const dayEvents = computed(() => {
  if (!selectedDay.value) return []
  const d = String(selectedDay.value).slice(0, 10)
  return calendarEvents.value.filter(e => new Date(e.start_time).toISOString().slice(0, 10) === d)
})

function onSelectDay (e) {
  const v = e.detail.value
  if (v) { selectedDay.value = v; showDayPopup.value = true }
}

async function load () {
  try {
    const y = currentMonth.value.getFullYear()
    const m = currentMonth.value.getMonth() + 1
    const r = await getCalendarEvents(y, m)
    calendarEvents.value = r?.data || r || []
  } catch (e) {
    showToast('Failed to load')
    calendarEvents.value = []
  }
}

async function onRefresh (ev) {
  await load()
  ev.target.complete()
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.events-link { margin-top: 12px; }
.empty-day { padding: 48px 16px; text-align: center; }
</style>
