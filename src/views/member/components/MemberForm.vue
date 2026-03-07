<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Member' : 'Add Member' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="form.name" placeholder="Name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="form.email" placeholder="Email" :disabled="isEdit" />
          </ion-item>
          <ion-item v-if="!isEdit">
            <ion-label position="stacked">Password</ion-label>
            <ion-input v-model="form.password" type="password" placeholder="Min 6 characters" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Phone</ion-label>
            <ion-input v-model="form.phone" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Department</ion-label>
            <ion-input v-model="form.department" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Position</ion-label>
            <ion-input v-model="form.position" placeholder="Optional" />
          </ion-item>
          <ion-item button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ statusText }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showStatusPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="s in statusCols" :key="s.value" button @click="form.status = s.value; showStatusPicker = false"><ion-label>{{ s.text }}</ion-label></ion-item>
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
  IonInput,
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createMember, updateMember, getMemberById } from '@/api/member'
import { createTenantMemberUser } from '@/api/tenant'
import { useUserStore } from '@/store/user'
import { validEmail } from '@/utils/validate'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const id = route.params.id
const isEdit = !!id

const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  department: '',
  position: '',
  status: 'active'
})

const statusCols = [{ text: 'Active', value: 'active' }, { text: 'Inactive', value: 'inactive' }, { text: 'Suspended', value: 'suspended' }]
const saving = ref(false)
const showStatusPicker = ref(false)

const statusText = computed(() => statusCols.find(s => s.value === form.status)?.text || form.status)

async function loadEdit () {
  if (!id) return
  try {
    const r = await getMemberById(id)
    const m = r?.data || r
    if (m) {
      form.name = m.name || ''
      form.email = m.email || ''
      form.phone = m.phone || ''
      form.department = m.department || ''
      form.position = m.position || ''
      form.status = m.status || 'active'
    }
  } catch (e) { showToast('Failed to load'); router.back() }
}

async function submit () {
  if (!form.name || !form.email) { showToast('Name and email required'); return }
  if (!isEdit && !form.password) { showToast('Password required'); return }
  if (!isEdit && !validEmail(form.email)) { showToast('Invalid email'); return }
  saving.value = true
  try {
    let res
    if (isEdit) {
      res = await updateMember(id, {
        name: form.name,
        phone: form.phone || null,
        department: form.department || null,
        position: form.position || null,
        status: form.status
      })
    } else {
      if (!userStore.tenantId) throw new Error('Tenant not found')
      const userRes = await createTenantMemberUser(userStore.tenantId, {
        email: form.email,
        name: form.name,
        password: form.password,
        status: form.status
      })
      if (!userRes?.success || !userRes?.data?.id) throw new Error('Failed to create user')
      res = await createMember({
        user_id: userRes.data.id,
        name: form.name,
        phone: form.phone || null,
        department: form.department || null,
        position: form.position || null,
        status: form.status
      })
    }
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : (isEdit ? 'Updated' : 'Created'))
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(() => { if (isEdit) loadEdit() })
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
