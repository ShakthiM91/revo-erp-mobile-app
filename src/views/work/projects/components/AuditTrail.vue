<template>
  <div class="audit-trail">
    <ion-button size="small" fill="outline" @click="load">Refresh</ion-button>
    <ion-spinner v-if="loading" name="crescent" class="spinner" />
    <ion-list v-else-if="auditLog.length" lines="inset">
      <ion-item v-for="entry in auditLog" :key="entry.id">
        <ion-label>
          <h2>{{ entry.action }} · {{ entry.entity_type }}</h2>
          <p v-if="entry.field_name">Field: {{ entry.field_name }}</p>
          <p v-if="entry.old_value || entry.new_value">
            {{ entry.old_value || '(empty)' }} → {{ entry.new_value || '(empty)' }}
          </p>
          <p class="meta">{{ formatDateTime(entry.changed_at) }} · User {{ entry.changed_by }}</p>
        </ion-label>
      </ion-item>
    </ion-list>
    <ion-note v-else class="empty-note">No audit records</ion-note>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IonList, IonItem, IonLabel, IonButton, IonSpinner, IonNote } from '@ionic/vue'
import { getProjectAuditLog } from '@/api/work'

const props = defineProps({
  projectId: { type: [Number, String], required: true }
})

const loading = ref(true)
const auditLog = ref([])

function formatDateTime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString()
}

async function load() {
  loading.value = true
  try {
    const res = await getProjectAuditLog(props.projectId, { limit: 100 })
    const data = res?.data ?? []
    auditLog.value = Array.isArray(data) ? data : []
  } catch (_) {
    auditLog.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.audit-trail { padding: 0; }
.spinner { margin: 24px auto; display: block; }
.meta { font-size: 12px; color: var(--ion-color-medium); }
.empty-note { display: block; padding: 24px; }
</style>
