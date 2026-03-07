<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Assign Role: {{ memberName || '' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving || !userId" @click="submit">Assign</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item button detail @click="showRolePicker = true">
            <ion-label position="stacked">Role</ion-label>
            <ion-note slot="end">{{ roleText || 'Select role' }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showRolePicker" @didDismiss="showRolePicker = false">
        <ion-header><ion-toolbar><ion-title>Role</ion-title><ion-buttons slot="end"><ion-button @click="showRolePicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="r in roleCols" :key="r.value" button @click="form.roleId = r.value; showRolePicker = false"><ion-label>{{ r.text }}</ion-label></ion-item>
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
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getRoles, assignRoleToUser } from '@/api/role'
import { getMemberById } from '@/api/member'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const memberName = ref('')
const userId = ref(null)
const roles = ref([])
const form = reactive({ roleId: null })
const saving = ref(false)
const showRolePicker = ref(false)

const roleText = computed(() => roles.value.find(r => r.id === form.roleId)?.name || '')
const roleCols = computed(() => roles.value.map(r => ({ text: r.name, value: r.id })))

async function load () {
  try {
    const [m, r] = await Promise.all([getMemberById(id), getRoles()])
    const member = m?.data || m
    if (member) {
      memberName.value = member.name || ''
      userId.value = member.user_id
      form.roleId = member.role_id || null
    }
    if (r?.data) roles.value = r.data
  } catch (_) {}
  if (!userId.value) showToast('Member has no user account')
}

async function submit () {
  if (!userId.value || !form.roleId) { showToast('Select a role'); return }
  saving.value = true
  try {
    await assignRoleToUser(userId.value, form.roleId)
    showToast('Role assigned')
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
