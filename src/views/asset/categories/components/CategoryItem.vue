<template>
  <div>
    <ion-item-sliding>
      <ion-item :class="{ 'category-child': isChild }">
        <ion-label>
          <h2>
            <ion-icon v-if="category.is_default" :icon="starOutline" class="star-icon" />
            {{ category.name }}
          </h2>
          <p v-if="category.description">{{ category.description }}</p>
        </ion-label>
        <ion-badge v-if="category.is_default" color="medium" slot="end">Default</ion-badge>
        <ion-badge v-else-if="!category.is_active" color="warning" slot="end">Inactive</ion-badge>
      </ion-item>
      <ion-item-options v-if="!category.is_default && category.tenant_id != null" side="end">
        <ion-item-option @click="$emit('add-child', category.id)">Add Child</ion-item-option>
        <ion-item-option @click="$emit('edit', category)">Edit</ion-item-option>
        <ion-item-option v-if="!category.children?.length" color="danger" @click="$emit('delete', category)">Delete</ion-item-option>
        <ion-item-option @click="$emit('toggle-active', category, !category.is_active)">
          {{ category.is_active ? 'Deactivate' : 'Activate' }}
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
    <template v-if="category.children?.length">
      <AssetCategoryItem
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :is-child="true"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-active="(c, a) => $emit('toggle-active', c, a)"
        @add-child="$emit('add-child', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import {
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonIcon
} from '@ionic/vue'
import { starOutline } from 'ionicons/icons'
import AssetCategoryItem from './CategoryItem.vue'

defineProps({
  category: { type: Object, required: true },
  isChild: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete', 'toggle-active', 'add-child'])
</script>

<style scoped>
.category-child { --padding-start: 32px; }
.star-icon { margin-right: 6px; vertical-align: middle; font-size: 14px; color: var(--ion-color-primary); }
</style>
