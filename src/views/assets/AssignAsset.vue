<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Assign: {{ assetName || 'Asset' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Assign</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item button detail @click="showMemberPicker = true">
            <ion-label position="stacked">Member</ion-label>
            <ion-note slot="end">{{ memberText || 'Select member' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea v-model="form.notes" placeholder="Optional" rows="3" />
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showMemberPicker" @didDismiss="showMemberPicker = false">
        <ion-header><ion-toolbar><ion-title>Member</ion-title><ion-buttons slot="end"><ion-button @click="showMemberPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="m in memberCols" :key="m.value" button @click="form.member_id = m.value; showMemberPicker = false"><ion-label>{{ m.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { assignAsset, getAssetById } from '@/api/asset'
import { getMembers } from '@/api/member'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const assetName = ref('')
const form = reactive({ member_id: null, notes: '' })
const members = ref([])
const saving = ref(false)
const showMemberPicker = ref(false)

const memberText = computed(() => members.value.find(m => m.id === form.member_id)?.name || '')
const memberCols = computed(() => members.value.map(m => ({ text: m.name, value: m.id })))

async function load () {
  try {
    const [r, m] = await Promise.all([getAssetById(id).catch(() => null), getMembers({ status: 'active', limit: 200 })])
    const a = r?.data || r
    if (a?.name) assetName.value = a.name
    if (m?.data) members.value = m.data
  } catch (_) {}
}

async function submit () {
  if (!form.member_id) { showToast('Select a member'); return }
  saving.value = true
  try {
    await assignAsset(id, form.member_id, form.notes || null)
    showToast('Assigned')
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
