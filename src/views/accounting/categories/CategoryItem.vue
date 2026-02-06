<template>
  <template v-if="category.children?.length">
    <!-- Parent with children: expandable accordion -->
    <ion-accordion :value="accordionValue">
      <ion-item slot="header" button detail="false" class="category-accordion-header">
        <ion-icon v-if="category.is_default" :icon="starOutline" class="star-icon" slot="start" />
        <ion-label>
          <h2>{{ category.name }}</h2>
          <p v-if="category.description">{{ category.description }}</p>
        </ion-label>
        <ion-badge v-if="category.is_default" color="danger" slot="end">Default</ion-badge>
        <ion-badge v-else-if="!category.is_active" color="warning" slot="end">Inactive</ion-badge>
        <ion-button
          v-if="!category.is_default && category.tenant_id != null"
          fill="clear"
          size="small"
          slot="end"
          @click.stop="openParentActions"
        >
          <ion-icon :icon="ellipsisVerticalOutline" />
        </ion-button>
        <ion-icon :icon="chevronDownOutline" slot="end" class="ion-accordion-toggle-icon" />
      </ion-item>
      <div slot="content">
        <ion-list lines="none" class="category-children">
          <CategoryItem
            v-for="child in category.children"
            :key="child.id"
            :category="child"
            :depth="depth + 1"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @toggle-active="(c, a) => $emit('toggle-active', c, a)"
            @add-child="$emit('add-child', $event)"
          />
        </ion-list>
      </div>
    </ion-accordion>
  </template>
  <template v-else>
    <!-- Leaf: swipeable item -->
    <ion-item-sliding :class="{ 'category-child': depth > 0 }">
      <ion-item :class="{ 'category-child-item': depth > 0 }">
        <ion-icon v-if="category.is_default" :icon="starOutline" class="star-icon" slot="start" />
        <ion-label>
          <h2>{{ category.name }}</h2>
          <p v-if="category.description">{{ category.description }}</p>
        </ion-label>
        <ion-badge v-if="category.is_default" color="danger" slot="end">Default</ion-badge>
        <ion-badge v-else-if="!category.is_active" color="warning" slot="end">Inactive</ion-badge>
      </ion-item>
      <ion-item-options v-if="!category.is_default && category.tenant_id != null" side="end">
        <ion-item-option @click="$emit('add-child', category.id)">Add Child</ion-item-option>
        <ion-item-option @click="$emit('edit', category)">Edit</ion-item-option>
        <ion-item-option color="danger" @click="$emit('delete', category)">Delete</ion-item-option>
        <ion-item-option @click="$emit('toggle-active', category, !category.is_active)">
          {{ category.is_active ? 'Deactivate' : 'Activate' }}
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/vue'
import { starOutline, chevronDownOutline, ellipsisVerticalOutline } from 'ionicons/icons'
import { showActionSheet } from '@/utils/ionicFeedback'
import CategoryItem from './CategoryItem.vue'

const props = defineProps({
  category: { type: Object, required: true },
  depth: { type: Number, default: 0 }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active', 'add-child'])

const accordionValue = computed(() => `cat-${props.category.id}-${props.depth}`)

async function openParentActions() {
  const c = props.category
  const buttons = [
    { text: 'Add Child', role: 'add-child', icon: 'add-outline' },
    { text: 'Edit', role: 'edit', icon: 'create-outline' },
    { text: c.is_active ? 'Deactivate' : 'Activate', role: 'toggle', icon: 'power-outline' },
    { text: 'Delete', role: 'delete', icon: 'trash-outline' },
    { text: 'Cancel', role: 'cancel', icon: 'close' }
  ]
  const role = await showActionSheet({
    header: c.name,
    buttons
  })
  if (role === 'add-child') emit('add-child', c.id)
  else if (role === 'edit') emit('edit', c)
  else if (role === 'delete') emit('delete', c)
  else if (role === 'toggle') emit('toggle-active', c, !c.is_active)
}
</script>

<style scoped>
.category-accordion-header {
  --padding-start: 16px;
}
.category-accordion-header h2 {
  font-size: 15px;
  font-weight: 500;
}
.category-children {
  --background: rgba(0, 0, 0, 0.03);
  padding: 0;
}
.category-child-item {
  --padding-start: 32px;
  font-size: 14px;
}
.star-icon {
  margin-right: 6px;
  font-size: 14px;
  color: var(--ion-color-primary);
}
</style>
