<template>
  <div v-if="needRefresh" class="pwa-update-banner">
    <div class="pwa-update-content">
      <img src="/icon-192.png" alt="" class="pwa-update-icon" />
      <div class="pwa-update-text">
        <strong>Update Available</strong>
        <span>A new version of Revo ERP is ready.</span>
      </div>
    </div>
    <div class="pwa-update-actions">
      <button type="button" class="pwa-update-btn" :disabled="updating" @click="applyUpdate">
        {{ updating ? 'Updating…' : 'Update Now' }}
      </button>
      <button type="button" class="pwa-update-later" @click="needRefresh = false">
        Later
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const updating = ref(false)

const { needRefresh, updateServiceWorker } = useRegisterSW()

async function applyUpdate() {
  updating.value = true
  await updateServiceWorker(true)
}
</script>

<style scoped>
.pwa-update-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #263445;
  color: #fff;
  padding: 12px 16px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.25);
  z-index: 99999;
  font-size: 14px;
}

.pwa-update-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.pwa-update-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.pwa-update-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pwa-update-text strong {
  font-size: 15px;
}

.pwa-update-text span {
  opacity: 0.8;
  line-height: 1.35;
}

.pwa-update-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-update-btn {
  padding: 10px 20px;
  background: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.2s;
}

.pwa-update-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.pwa-update-later {
  padding: 8px 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  border: none;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
