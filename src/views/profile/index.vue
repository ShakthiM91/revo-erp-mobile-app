<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/me" />
        </ion-buttons>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="onUpdateProfile">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="profileForm.name" placeholder="Your name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="profileForm.email" disabled />
          </ion-item>
        </ion-list>
        <div class="form-actions">
          <ion-button expand="block" type="submit" :disabled="profileLoading">
            {{ profileLoading ? 'Updating...' : 'Update Profile' }}
          </ion-button>
        </div>
      </form>

      <ion-item-divider />

      <ion-list lines="inset">
        <ion-item button detail @click="showPasswordModal = true">
          <ion-label>Change Password</ion-label>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="showPasswordModal" @didDismiss="showPasswordModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Change Password</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showPasswordModal = false">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <form @submit.prevent="onChangePassword">
            <ion-list lines="inset">
              <ion-item>
                <ion-label position="stacked">Current</ion-label>
                <ion-input v-model="passwordForm.currentPassword" type="password" placeholder="Current password" />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">New</ion-label>
                <ion-input v-model="passwordForm.newPassword" type="password" placeholder="Min 6 characters" />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Confirm</ion-label>
                <ion-input v-model="passwordForm.confirmPassword" type="password" placeholder="Confirm" />
              </ion-item>
            </ion-list>
            <div class="form-actions">
              <ion-button expand="block" type="submit" :disabled="passwordLoading">
                {{ passwordLoading ? 'Changing...' : 'Change Password' }}
              </ion-button>
            </div>
          </form>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonItemDivider,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import { changePassword } from '@/api/auth'

const userStore = useUserStore()
const profileForm = reactive({ name: '', email: '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const profileLoading = ref(false)
const passwordLoading = ref(false)
const showPasswordModal = ref(false)

async function onUpdateProfile () {
  if (!profileForm.name?.trim()) {
    showToast('Name is required')
    return
  }
  if (profileForm.name.length < 2 || profileForm.name.length > 50) {
    showToast('Name must be 2–50 characters')
    return
  }
  profileLoading.value = true
  try {
    await userStore.updateUserProfile({ name: profileForm.name })
    showToast('Profile updated')
  } catch (e) {
    showToast(e?.message || 'Update failed')
  } finally {
    profileLoading.value = false
  }
}

async function onChangePassword () {
  if (!passwordForm.currentPassword) {
    showToast('Current password is required')
    return
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    showToast('New password must be at least 6 characters')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('Passwords do not match')
    return
  }
  passwordLoading.value = true
  try {
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    showToast('Password changed')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showPasswordModal.value = false
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  profileForm.name = userStore.name || ''
  profileForm.email = userStore.email || ''
})
</script>

<style scoped>
ion-content {
  --background: #f7f8fa;
}
.form-actions { padding: 16px; }
</style>
