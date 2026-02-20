<template>
  <div v-if="canShowBanner" class="pwa-install-banner">
    <button
      type="button"
      class="pwa-install-dismiss"
      aria-label="Dismiss"
      @click="dismiss"
    >
      <ion-icon :icon="closeOutline" />
    </button>
    <div class="pwa-install-content">
      <img src="/icon-192.png" alt="" class="pwa-install-icon" />
      <div class="pwa-install-text">
        <strong>Install Revo ERP</strong>
        <span v-if="platform === 'android' && hasNativePrompt">
          Add to your home screen for quick access.
        </span>
        <span v-else-if="platform === 'android'">
          Use the browser menu (⋮) and tap &quot;Install app&quot; or &quot;Add to Home screen&quot;.
        </span>
        <span v-else-if="platform === 'ios'">
          Tap the Share button, then &quot;Add to Home Screen&quot;.
        </span>
      </div>
      <button
        v-if="platform === 'ios'"
        type="button"
        class="pwa-install-share-hint"
        aria-hidden="true"
      >
        <ion-icon :icon="shareOutline" />
      </button>
    </div>
    <div class="pwa-install-actions">
      <template v-if="platform === 'android' && hasNativePrompt">
        <button type="button" class="pwa-install-btn" @click="triggerInstall">
          Install
        </button>
        <button type="button" class="pwa-install-later" @click="dismiss">
          Maybe Later
        </button>
      </template>
      <template v-else>
        <button type="button" class="pwa-install-btn" @click="dismiss">
          Got it
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import { shareOutline, closeOutline } from 'ionicons/icons'
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const { canShowBanner, platform, hasNativePrompt, triggerInstall, dismiss } = useInstallPrompt()
</script>

<style scoped>
.pwa-install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1989fa;
  color: #fff;
  padding: 12px 16px 16px;
  padding-right: 44px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 99999;
  font-size: 14px;
}

.pwa-install-dismiss {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.pwa-install-dismiss:hover {
  background: rgba(255, 255, 255, 0.3);
}

.pwa-install-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.pwa-install-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  flex-shrink: 0;
}

.pwa-install-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pwa-install-text strong {
  font-size: 15px;
}

.pwa-install-text span {
  opacity: 0.95;
  line-height: 1.35;
}

.pwa-install-share-hint {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 20px;
}

.pwa-install-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-install-btn {
  padding: 10px 20px;
  background: #fff;
  color: #1989fa;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.pwa-install-later {
  padding: 8px 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  border: none;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
