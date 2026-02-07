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
        <ion-title>Members</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/members/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-searchbar
        :value="searchQuery"
        placeholder="Search name or email"
        @ionInput="searchQuery = $event.detail.value"
        @ionChange="onSearch"
      />

      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <template v-if="loading && list.length === 0">
        <div v-for="i in 5" :key="'sk-' + i" class="list-skeleton">
          <ion-skeleton-text animated style="width: 60%; height: 16px" />
          <ion-skeleton-text animated style="width: 40%; height: 12px; margin-top: 8px" />
        </div>
      </template>
      <template v-else>
        <ion-list lines="inset">
          <ion-item-sliding v-for="row in list" :key="row.id">
            <ion-item button @click="$router.push(`/members/${row.id}`)">
              <ion-label>
                <h2>{{ row.name }}</h2>
                <p>{{ (row.email || '') + ' · ' + (row.status || '') }}</p>
              </ion-label>
              <ion-badge v-if="row.user_id" color="success" @click.stop="$router.push(`/members/${row.id}/assign-role`)">Role</ion-badge>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="primary" @click="$router.push(`/members/${row.id}`)">Edit</ion-item-option>
              <ion-item-option v-if="row.user_id" color="success" @click="$router.push(`/members/${row.id}/assign-role`)">Role</ion-item-option>
              <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
        <ion-infinite-scroll v-if="!finished && list.length > 0" @ionInfinite="onLoad" threshold="100px">
          <ion-infinite-scroll-content loading-spinner="crescent" />
        </ion-infinite-scroll>
      </template>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No members</ion-note>
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
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getMembers, deleteMember } from '@/api/member'

const list = ref([])
const listQuery = ref({ limit: 30, offset: 0, search: '' })
const searchQuery = ref('')
const loading = ref(false)
const finished = ref(false)

async function load () {
  loading.value = true
  try {
    const params = { ...listQuery.value }
    if (!params.search) delete params.search
    const res = await getMembers(params)
    const data = res?.data || []
    if (listQuery.value.offset === 0) list.value = data
    else list.value.push(...data)
    listQuery.value.offset += data.length
    finished.value = data.length < (listQuery.value.limit || 30)
  } catch (e) {
    showToast('Failed to load')
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function onRefresh (ev) {
  listQuery.value.offset = 0
  finished.value = false
  await load()
  ev.target.complete()
}

function onSearch () {
  listQuery.value.search = searchQuery.value || ''
  listQuery.value.offset = 0
  finished.value = false
  load()
}

async function onLoad (ev) {
  await load()
  ev.target.complete()
}

async function onDelete (row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    await deleteMember(row.id)
    showToast('Deleted')
    listQuery.value.offset = 0
    finished.value = false
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.list-skeleton { padding: 12px 16px; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
