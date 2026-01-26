<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="login-card">
            <div class="title-block">
              <h1 class="title">Revo ERP</h1>
              <!-- <p class="subtitle">Tenant Admin</p>   -->
            </div>

            <ion-list lines="none" class="login-list">
              <ion-item>
                <ion-input
                  v-model="loginForm.email"
                  type="email"
                  placeholder="Email"
                  clear-on-edit="false"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  v-model="loginForm.password"
                  :type="passwordType"
                  placeholder="Password"
                  clear-on-edit="false"
                />
                <ion-button fill="clear" slot="end" @click.prevent="togglePassword">
                  <ion-icon :icon="passwordType === 'password' ? eyeOutline : eyeOffOutline" />
                </ion-button>
              </ion-item>
            </ion-list>
            <div class="form-actions">
              <ion-button expand="block" type="submit" :disabled="loading">
                {{ loading ? 'Logging in...' : 'Login' }}
              </ion-button>
            </div>
          </div>

          <!-- <p class="tips">Tenant Admin: demo@demo.revo-erp.com / demo123</p> -->
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent, IonList, IonItem, IonInput, IonButton, IonIcon } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import { validEmail } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = reactive({ email: '', password: '' })
const passwordType = ref('password')
const loading = ref(false)

const togglePassword = () => {
  passwordType.value = passwordType.value === 'password' ? 'text' : 'password'
}

const handleLogin = async () => {
  if (!loginForm.email?.trim()) {
    showToast('Please enter email')
    return
  }
  if (!validEmail(loginForm.email)) {
    showToast('Please enter a valid email')
    return
  }
  if (!loginForm.password) {
    showToast('Please enter password')
    return
  }
  if (loginForm.password.length < 6) {
    showToast('Password must be at least 6 characters')
    return
  }
  loading.value = true
  try {
    await userStore.login(loginForm)
    await userStore.getInfo()
    const redirect = route.query.redirect || '/'
    router.push(redirect)
    showToast('Login successful')
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Login failed'
    showToast(msg)
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 24px;
}
.login-form {
  width: 100%;
  max-width: 340px;
}
.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.login-list {
  background: transparent;
  padding: 0;
}
.title-block {
  text-align: center;
  margin-bottom: 20px;
}
.title {
  font-size: 24px;
  color: #323233;
  margin: 0 0 4px 0;
  font-weight: 700;
}
.subtitle {
  font-size: 13px;
  color: #969799;
  margin: 0;
}
.form-actions {
  padding: 16px 0 0;
}
.form-actions ion-button {
  --border-radius: 20px;
}
.tips {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-top: 24px;
}
</style>
