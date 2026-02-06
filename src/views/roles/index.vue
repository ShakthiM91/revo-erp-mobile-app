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
        <ion-title>Member Roles</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openForm()">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="list.length" lines="inset">
        <ion-item-sliding v-for="row in list" :key="row.id">
          <ion-item button @click="openForm(row)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ row.description || '-' }}</p>
            </ion-label>
            <ion-badge :color="row.status === 'active' ? 'success' : 'medium'" slot="end">{{ row.status }}</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option @click="openForm(row)">Edit</ion-item-option>
            <ion-item-option color="primary" @click="openAssignMenus(row)">Menus</ion-item-option>
            <ion-item-option color="warning" @click="openAssignPermissions(row)">Permissions</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No roles</ion-note>
      </div>
    </ion-content>

    <RoleForm
      :is-open="formOpen"
      :role="currentRole"
      @close="formOpen = false"
      @success="onFormSuccess"
    />
    <AssignMenus
      :is-open="assignMenusOpen"
      :role-id="currentRole?.id"
      :role-name="currentRole?.name"
      @close="assignMenusOpen = false"
    />
    <AssignPermissions
      :is-open="assignPermissionsOpen"
      :role-id="currentRole?.id"
      :role-name="currentRole?.name"
      @close="assignPermissionsOpen = false"
      @success="onAssignPermissionsSuccess"
    />
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getRoles, deleteRole } from '@/api/role'
import RoleForm from './RoleForm.vue'
import AssignMenus from './AssignMenus.vue'
import AssignPermissions from './AssignPermissions.vue'

const list = ref([])
const loading = ref(false)
const formOpen = ref(false)
const assignMenusOpen = ref(false)
const assignPermissionsOpen = ref(false)
const currentRole = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await getRoles()
    const data = res?.data ?? res?.success ? res?.data : []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast('Failed to load')
    list.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function openForm(role = null) {
  currentRole.value = role ? { ...role } : null
  formOpen.value = true
}

function openAssignMenus(role) {
  currentRole.value = { ...role }
  assignMenusOpen.value = true
}

function openAssignPermissions(role) {
  currentRole.value = { ...role }
  assignPermissionsOpen.value = true
}

function onFormSuccess() {
  formOpen.value = false
  showToast(currentRole.value ? 'Updated' : 'Created')
  load()
}

function onAssignPermissionsSuccess() {
  assignPermissionsOpen.value = false
  showToast('Permissions assigned')
}

async function onDelete(row) {
  try {
    await showConfirmDialog({ title: 'Delete Role', message: `Delete "${row.name}"?` })
    await deleteRole(row.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
