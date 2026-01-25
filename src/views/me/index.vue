<template>
  <ion-page>
    <ion-content>
      <div class="me-page">
        <div class="me-header">
          <div class="me-avatar">
            <ion-icon :icon="personCircleOutline" class="avatar-icon" />
          </div>
          <div class="me-name">{{ userStore.name || 'User' }}</div>
        </div>

        <ion-item-divider />

        <ion-list lines="inset">
          <ion-item button detail href="/profile">
            <ion-icon :icon="personOutline" slot="start" />
            <ion-label>Profile</ion-label>
          </ion-item>
          <ion-item button detail href="/settings">
            <ion-icon :icon="settingsOutline" slot="start" />
            <ion-label>Settings</ion-label>
          </ion-item>
          <ion-item button detail href="/members">
            <ion-icon :icon="peopleOutline" slot="start" />
            <ion-label>Members</ion-label>
          </ion-item>
        </ion-list>

        <ion-item-divider />

        <div class="logout-wrap">
          <ion-button expand="block" color="danger" @click="handleLogout">Logout</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonItemDivider,
  IonButton
} from '@ionic/vue'
import { personCircleOutline, personOutline, settingsOutline, peopleOutline } from 'ionicons/icons'
import { showConfirmDialog } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?'
    })
    await userStore.logout()
    router.replace('/login')
  } catch (e) {
    if (e !== 'cancel') throw e
  }
}
</script>

<style scoped>
.me-page {
  padding: 16px 0;
  min-height: 100%;
  background: #f7f8fa;
}
.me-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 8px;
}
.me-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8c9cc;
}
.avatar-icon {
  font-size: 56px;
}
.me-name {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}
.logout-wrap {
  padding: 16px;
}
</style>
