<template>
  <ion-app>
    <ion-menu content-id="main" side="start" type="overlay" class="app-menu">
      <AppMenuContent />
    </ion-menu>
    <ion-router-outlet id="main" />
  </ion-app>
</template>

<script setup>
import { IonApp, IonMenu, IonRouterOutlet } from '@ionic/vue'
import AppMenuContent from '@/components/AppMenu/AppMenuContent.vue'
</script>

<style>
/* * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
} */
html, body, #app {
  height: 100%;
  -webkit-font-smoothing: antialiased;
}
:root {
  --ion-color-primary: #1989fa;
}

/* Side menu: dark theme with high contrast */
ion-menu.app-menu {
  --background: #263445;
  --width: 280px;
}
ion-menu.app-menu::part(backdrop) {
  background: rgba(0, 0, 0, 0.5);
}
ion-menu.app-menu::part(container) {
  background: #263445;
}
/* All menu items (including accordion headers) use dark background */
ion-menu.app-menu ion-item {
  --background: #263445;
  --color: #e4e7ed;
}
ion-menu.app-menu ion-item.ion-activated {
  --background: rgba(255, 255, 255, 0.1);
  --color: #fff;
}

/* Center toast message text */
ion-toast.toast-center::part(container) {
  text-align: center;
  justify-content: center;
}
ion-toast.toast-center::part(message) {
  text-align: center;
  display: block;
  width: 100%;
}
</style>
