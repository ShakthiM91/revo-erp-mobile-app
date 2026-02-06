<template>
  <div class="menu-content">
    <div class="menu-header">
      <img v-if="logoUrl" :src="logoUrl" alt="" class="menu-logo" />
      <h2 class="menu-title">{{ appName || 'Revo ERP' }}</h2>
    </div>
    <ion-content class="menu-list-content">
      <ion-accordion-group v-if="menuTree.length > 0" :multiple="true" class="menu-accordion">
        <template v-for="item in menuTree" :key="item.path || item.name">
          <MenuItem
            v-if="item.children?.length"
            :item="item"
            :depth="0"
            @navigate="navigate"
          />
          <ion-menu-toggle v-else-if="item.path">
            <ion-item
              button
              :detail="false"
              @click="navigate(item.path)"
            >
              <ion-icon :icon="getMenuIcon(item.icon)" slot="start" />
              <ion-label>{{ item.name }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </template>
      </ion-accordion-group>
      <div v-else-if="!loading" class="menu-empty">
        <ion-note>No menu items</ion-note>
      </div>
    </ion-content>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonNote,
  IonAccordionGroup
} from '@ionic/vue'
import { useUserStore } from '@/store/user'
import { getTenant } from '@/api/tenant'
import { filterAndMapMenuTree } from '@/utils/menuRoutes'
import { getMenuIcon } from '@/utils/menuIcons'
import MenuItem from './MenuItem.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const appName = ref('')
const logoUrl = ref(null)

const menuTree = computed(() => {
  const menus = userStore.menus || []
  return filterAndMapMenuTree(menus)
})

async function loadBranding() {
  const tenantId = userStore.tenantId
  if (!tenantId) return
  loading.value = true
  try {
    const res = await getTenant()
    const data = res?.data
    if (data?.settings) {
      const settings = typeof data.settings === 'string' ? JSON.parse(data.settings || '{}') : data.settings
      appName.value = settings.app_name || data.name || ''
      if (settings.logo_url) {
        logoUrl.value = settings.logo_url
      } else if (settings.logo_path) {
        const path = settings.logo_path
        if (path.startsWith('http://') || path.startsWith('https://')) {
          logoUrl.value = path
        } else {
          const base = (data.attachment_base_url || '').replace(/\/$/, '')
          logoUrl.value = base ? `${base}/${path.replace(/^\//, '')}` : null
        }
      } else {
        logoUrl.value = null
      }
    }
  } catch (e) {
    console.error('Failed to load tenant branding:', e)
  } finally {
    loading.value = false
  }
}

function navigate(path) {
  if (path) router.push(path)
}

onMounted(() => {
  loadBranding()
})
</script>

<style scoped>
.menu-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #263445;
}
.menu-header {
  padding: 16px;
  background: #1e2633;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.menu-logo {
  max-width: 120px;
  max-height: 40px;
  object-fit: contain;
  margin-bottom: 8px;
}
.menu-title {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}
.menu-list-content {
  --background: #263445;
  --color: #e4e7ed;
}
.menu-list-content ion-item {
  --background: #263445;
  --color: #e4e7ed;
  --min-height: 48px;
}
.menu-list-content ion-item:hover,
.menu-list-content ion-item.ion-activated {
  --background: rgba(255, 255, 255, 0.1);
  --color: #fff;
}
.menu-list-content ion-label {
  font-weight: 500;
}
.menu-list-content ion-icon {
  color: #e4e7ed;
  opacity: 0.95;
}
.menu-empty {
  padding: 24px 16px;
  text-align: center;
}
.menu-empty ion-note {
  color: #a8abb2;
}
.menu-accordion {
  --background: #263445;
}
.menu-accordion ion-accordion {
  --background: #263445;
}
.menu-accordion ion-accordion-group {
  --background: #263445;
}
/* Accordion header items - force dark background (override Ionic default white) */
:deep(.menu-accordion ion-accordion ion-item[slot="header"]) {
  --background: #263445 !important;
  --color: #e4e7ed;
  background: #263445 !important;
}
:deep(.menu-accordion ion-accordion ion-item[slot="header"]:hover),
:deep(.menu-accordion ion-accordion ion-item[slot="header"].ion-activated) {
  --background: rgba(255, 255, 255, 0.1);
  --color: #fff;
}
:deep(.menu-accordion ion-accordion ion-item[slot="header"] ion-icon) {
  color: #e4e7ed;
}
:deep(.menu-accordion ion-accordion .ion-accordion-toggle-icon) {
  color: #e4e7ed;
}
:deep(.menu-accordion ion-accordion [slot="content"]) {
  background: rgba(0, 0, 0, 0.2);
}
</style>
