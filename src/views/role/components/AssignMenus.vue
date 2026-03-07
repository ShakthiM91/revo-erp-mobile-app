<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Close</ion-button>
        </ion-buttons>
        <ion-title>Menus for {{ roleName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-note v-else-if="menuTree.length === 0" class="empty-note">
        No menus. Assign permissions to this role to see menus here.
      </ion-note>
      <ion-list v-else lines="inset">
        <template v-for="node in menuTree" :key="node.id">
          <ion-item>
            <ion-label>
              <h2>{{ node.name }}</h2>
            </ion-label>
          </ion-item>
          <ion-item v-for="child in (node.children || [])" :key="child.id" class="menu-child">
            <ion-label>
              <p>{{ child.name }}</p>
            </ion-label>
          </ion-item>
        </template>
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
  IonLabel,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getRoleMenus } from '@/api/role'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  roleId: { type: Number, default: null },
  roleName: { type: String, default: '' }
})

defineEmits(['close'])

const loading = ref(false)
const menuTree = ref([])

function buildTree(items) {
  const map = {}
  const roots = []
  items.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })
  items.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      roots.push(map[item.id])
    }
  })
  return roots
}

async function loadData() {
  if (!props.roleId) return
  try {
    loading.value = true
    const res = await getRoleMenus(props.roleId)
    const list = res?.data ?? (Array.isArray(res) ? res : [])
    menuTree.value = buildTree(list)
  } catch (e) {
    showToast('Failed to load menus')
    menuTree.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.isOpen, props.roleId],
  ([open]) => {
    if (open) {
      loadData()
    } else {
      menuTree.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-note { display: block; padding: 48px 16px; text-align: center; color: var(--ion-color-medium); }
.menu-child { --padding-start: 32px; }
</style>
