<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Cancel</ion-button>
        </ion-buttons>
        <ion-title>Assign Permissions</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="submitting" @click="submit">Assign</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-note v-else-if="menusWithPermissions.length === 0" class="empty-note">
        No permissions available
      </ion-note>
      <ion-list v-else lines="none">
        <ion-item-group v-for="menu in menusWithPermissions" :key="menu.id">
          <ion-item-divider>
            <ion-label>{{ menu.name }}</ion-label>
          </ion-item-divider>
          <ion-item v-for="perm in (menu.permissions || [])" :key="perm.id" lines="inset">
            <ion-checkbox
              slot="start"
              :checked="checkedPermissions.includes(perm.id)"
              @ionChange="togglePermission(perm.id, $event.detail.checked)"
            />
            <ion-label>
              <h3>{{ perm.name }}</h3>
              <p>{{ perm.code }}</p>
            </ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonCheckbox,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getMyPermissions } from '@/api/auth'
import { assignPermissions, getRolePermissions } from '@/api/role'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  roleId: { type: Number, default: null },
  roleName: { type: String, default: '' }
})

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const submitting = ref(false)
const menusWithPermissions = ref([])
const checkedPermissions = ref([])

function togglePermission(id, checked) {
  if (checked) {
    if (!checkedPermissions.value.includes(id)) {
      checkedPermissions.value = [...checkedPermissions.value, id]
    }
  } else {
    checkedPermissions.value = checkedPermissions.value.filter(p => p !== id)
  }
}

async function loadData() {
  if (!props.roleId) return
  try {
    loading.value = true
    const [myRes, roleRes] = await Promise.all([
      getMyPermissions(),
      getRolePermissions(props.roleId)
    ])
    const myData = myRes?.data ?? (myRes?.success ? myRes?.data : [])
    menusWithPermissions.value = Array.isArray(myData) ? myData : []

    const roleData = roleRes?.data ?? (Array.isArray(roleRes) ? roleRes : [])
    const ids = (roleData || []).map(item => item.permission_id ?? item.id)
    checkedPermissions.value = ids
  } catch (e) {
    showToast('Failed to load permissions')
    menusWithPermissions.value = []
    checkedPermissions.value = []
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!props.roleId) return
  submitting.value = true
  try {
    await assignPermissions(props.roleId, checkedPermissions.value)
    showToast('Permissions assigned')
    emit('success')
    emit('close')
  } catch (e) {
    showToast(e?.message || 'Failed to assign')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      checkedPermissions.value = []
      menusWithPermissions.value = []
      loadData()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-note { display: block; padding: 48px 16px; text-align: center; color: var(--ion-color-medium); }
ion-checkbox { margin-right: 12px; }
</style>
