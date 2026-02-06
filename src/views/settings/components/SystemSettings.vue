<template>
  <div class="settings-content">
    <ion-list lines="inset">
      <ion-item button detail @click="showTimezonePicker = true">
        <ion-label position="stacked">Timezone</ion-label>
        <ion-note slot="end">{{ timezoneLabel }}</ion-note>
      </ion-item>
      <ion-item button detail @click="showLanguagePicker = true">
        <ion-label position="stacked">Language</ion-label>
        <ion-note slot="end">{{ languageLabel }}</ion-note>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Application Name</ion-label>
        <ion-input v-model="form.app_name" placeholder="App name" />
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Logo</ion-label>
        <div class="logo-row">
          <img v-if="logoPreview" :src="logoPreview" alt="Logo" class="logo-preview" />
          <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />
          <ion-button size="small" @click="fileInput?.click()">Select</ion-button>
          <ion-button v-if="logoPreview" size="small" color="danger" @click="removeLogo">Remove</ion-button>
        </div>
      </ion-item>
    </ion-list>
    <div class="actions">
      <ion-button expand="block" :disabled="saving" @click="save">Save</ion-button>
    </div>

    <ion-modal :is-open="showTimezonePicker" @didDismiss="showTimezonePicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Timezone</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showTimezonePicker = false">Done</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-searchbar v-model="tzSearch" placeholder="Search" />
        <ion-list>
          <ion-item v-for="tz in filteredTimezones" :key="tz.value" button @click="form.timezone = tz.value; showTimezonePicker = false">
            <ion-label>{{ tz.label }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="showLanguagePicker" @didDismiss="showLanguagePicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Language</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showLanguagePicker = false">Done</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item v-for="lang in languages" :key="lang.value" button @click="form.language = lang.value; showLanguagePicker = false">
            <ion-label>{{ lang.label }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonButton,
  IonModal,
  IonSearchbar
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getTenant, updateTenant } from '@/api/tenant'
import { uploadFile, constructFileUrl } from '@/api/attachment'
import timezonesData from '@/data/timezones.json'

const saving = ref(false)
const showTimezonePicker = ref(false)
const showLanguagePicker = ref(false)
const logoPreview = ref(null)
const logoFile = ref(null)
const fileInput = ref(null)
const tzSearch = ref('')

const timezones = ref(timezonesData || [])
const languages = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'Japanese', value: 'ja' }
]

const form = reactive({
  timezone: 'UTC',
  language: 'en',
  app_name: '',
  logo_path: ''
})

const filteredTimezones = computed(() => {
  const q = (tzSearch.value || '').toLowerCase()
  if (!q) return timezones.value.slice(0, 100)
  return timezones.value.filter(t => t.label.toLowerCase().includes(q)).slice(0, 100)
})

const timezoneLabel = computed(() => {
  const t = timezones.value.find(x => x.value === form.timezone)
  return t?.label || form.timezone
})

const languageLabel = computed(() => {
  const l = languages.find(x => x.value === form.language)
  return l?.label || form.language
})

async function load() {
  try {
    const res = await getTenant()
    const tenant = res?.data ?? res
    const settings = tenant?.settings
    const s = typeof settings === 'string' ? (JSON.parse(settings || '{}')) : (settings || {})
    form.timezone = s.timezone || 'UTC'
    form.language = s.language || 'en'
    form.app_name = s.app_name || ''
    form.logo_path = s.logo_path || ''
    if (s.logo_url) {
      logoPreview.value = s.logo_url
    } else if (form.logo_path) {
      logoPreview.value = await constructFileUrl(form.logo_path)
    } else {
      logoPreview.value = null
    }
  } catch (e) {
    showToast('Failed to load')
  }
}

function onFileChange(ev) {
  const file = ev.target?.files?.[0]
  if (!file) return
  const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
  if (!valid.includes(file.type)) {
    showToast('Invalid file type')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File too large (max 5MB)')
    return
  }
  logoFile.value = file
  const r = new FileReader()
  r.onload = e => { logoPreview.value = e.target.result }
  r.readAsDataURL(file)
}

function removeLogo() {
  logoFile.value = null
  logoPreview.value = null
  form.logo_path = ''
}

async function save() {
  saving.value = true
  try {
    const res = await getTenant()
    let current = {}
    const tenant = res?.data ?? res
    if (tenant?.settings) {
      current = typeof tenant.settings === 'string' ? JSON.parse(tenant.settings || '{}') : tenant.settings
    }
    if (logoFile.value) {
      const up = await uploadFile(logoFile.value, { category: 'logos', type: 'logo' })
      const d = up?.data ?? up
      form.logo_path = d?.path ?? ''
      logoPreview.value = d?.url ?? logoPreview.value
      logoFile.value = null
    }
    const settings = {
      ...current,
      timezone: form.timezone,
      language: form.language,
      app_name: form.app_name,
      logo_path: form.logo_path
    }
    await updateTenant({ settings })
    showToast('Saved')
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.settings-content { padding: 16px; }
.actions { padding: 24px 0; }
.logo-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.logo-preview { max-width: 80px; max-height: 40px; object-fit: contain; border-radius: 4px; }
.file-input { display: none; }
</style>
