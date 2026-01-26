<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body, #app {
  height: 100%;
  -webkit-font-smoothing: antialiased;
}
:root {
  --ion-color-primary: #1989fa;
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
