<template>
  <template v-if="item.children && item.children.length > 0">
    <!-- Parent with children: expandable section (uses header/content slots) -->
    <ion-accordion :value="accordionValue">
      <ion-item slot="header" button detail="false" class="menu-parent-item">
        <ion-icon :icon="getMenuIcon(item.icon)" slot="start" />
        <ion-label>{{ item.name }}</ion-label>
        <ion-icon :icon="chevronDownOutline" slot="end" class="ion-accordion-toggle-icon" />
      </ion-item>
      <div slot="content">
        <ion-list lines="none" class="menu-children">
          <MenuItem
            v-for="child in item.children"
            :key="child.path || child.name"
            :item="child"
            :depth="depth + 1"
            @navigate="$emit('navigate', $event)"
          />
        </ion-list>
      </div>
    </ion-accordion>
  </template>
  <template v-else-if="item.path">
    <!-- Leaf item: direct link -->
    <ion-menu-toggle>
      <ion-item
        button
        :detail="false"
        class="menu-leaf-item"
        :class="{ 'menu-nested': depth > 0 }"
        @click="$emit('navigate', item.path)"
      >
        <ion-icon :icon="getMenuIcon(item.icon)" slot="start" />
        <ion-label>{{ item.name }}</ion-label>
      </ion-item>
    </ion-menu-toggle>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import {
  IonAccordion,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/vue'
import { chevronDownOutline } from 'ionicons/icons'
import { getMenuIcon } from '@/utils/menuIcons'
import MenuItem from './MenuItem.vue'

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 }
})

defineEmits(['navigate'])

const accordionValue = computed(() => props.item.name || props.item.path || `item-${props.depth}`)
</script>

<style scoped>
.menu-parent-item {
  --background: #263445 !important;
  --color: #e4e7ed;
  --padding-start: 16px;
  font-weight: 500;
  background: #263445;
}
.menu-parent-item.ion-activated {
  --background: rgba(255, 255, 255, 0.1);
  --color: #fff;
}
.menu-leaf-item {
  --background: #263445 !important;
  --color: #e4e7ed;
  --padding-start: 16px;
  background: #263445;
}
.menu-leaf-item.menu-nested {
  --padding-start: 32px;
  font-size: 14px;
  --color: #d8dce5;
}
.menu-leaf-item.ion-activated {
  --background: rgba(255, 255, 255, 0.1);
  --color: #fff;
}
.menu-children {
  --background: #263445;
  padding: 0;
}
.menu-children ion-item {
  --background: #263445;
  --color: #d8dce5;
}
.menu-children ion-item.ion-activated {
  --color: #fff;
}
</style>
