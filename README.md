# Revo ERP - Mobile Web Application

Mobile-first member portal built with Vue 3, Vant UI, and Capacitor.

## Overview

The Mobile App provides members with:
- Personal profile management
- View schedule and upcoming events
- View assigned assets
- Check-in and quick actions
- Notifications
- Mobile-optimized interface

## Technology Stack

- **Framework**: Vue 3 + Vite
- **UI Library**: Vant 4 (Mobile UI components)
- **State Management**: Pinia
- **Router**: Vue Router
- **HTTP Client**: Axios
- **Native Bridge**: Capacitor (for future iOS/Android apps)

## Setup

```bash
# Create project
npm create vite@latest mobile-app -- --template vue
cd mobile-app

# Install dependencies
npm install vant
npm install vue-router pinia axios
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor (for future native apps)
npx cap init

npm run dev
```

## Project Structure

```
mobile-app/
├── src/
│   ├── api/                # API modules
│   │   ├── auth.js
│   │   ├── member.js
│   │   ├── schedule.js
│   │   └── asset.js
│   ├── assets/
│   ├── components/
│   │   ├── NavBar.vue      # Custom navigation
│   │   └── TabBar.vue      # Bottom tab bar
│   ├── router/
│   │   └── index.js
│   ├── store/
│   │   ├── user.js
│   │   └── app.js
│   ├── utils/
│   │   ├── request.js
│   │   └── storage.js
│   ├── views/
│   │   ├── home/           # Home dashboard
│   │   ├── profile/        # User profile
│   │   ├── schedule/       # Calendar & events
│   │   ├── assets/         # Assigned assets
│   │   ├── login/
│   │   └── about/
│   ├── App.vue
│   └── main.js
├── capacitor.config.json   # Capacitor config
├── package.json
└── vite.config.js
```

## Key Features

### 1. Login Screen

```vue
<!-- src/views/login/index.vue -->
<template>
  <div class="login-page">
    <van-nav-bar title="Revo ERP Login" />
    
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="Email"
          placeholder="Enter email"
          :rules="[{ required: true, message: 'Email is required' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="Password"
          placeholder="Enter password"
          :rules="[{ required: true, message: 'Password is required' }]"
        />
      </van-cell-group>
      
      <div class="button-container">
        <van-button round block type="primary" native-type="submit">
          Login
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()
const email = ref('')
const password = ref('')

const onSubmit = async () => {
  try {
    await userStore.login({ email: email.value, password: password.value })
    showToast('Login successful')
    router.push('/home')
  } catch (error) {
    showToast('Login failed: ' + error.message)
  }
}
</script>
```

### 2. Home Dashboard

```vue
<!-- src/views/home/index.vue -->
<template>
  <div class="home-page">
    <van-nav-bar title="Dashboard" />
    
    <!-- User Info Card -->
    <van-cell-group inset>
      <van-cell
        :title="userStore.name"
        :label="userStore.department"
        is-link
        @click="router.push('/profile')"
      >
        <template #icon>
          <van-image
            round
            width="40"
            height="40"
            :src="userStore.avatar || defaultAvatar"
          />
        </template>
      </van-cell>
    </van-cell-group>
    
    <!-- Quick Actions -->
    <van-grid :column-num="4" style="margin-top: 16px;">
      <van-grid-item icon="calendar-o" text="Schedule" @click="router.push('/schedule')" />
      <van-grid-item icon="shop-o" text="Assets" @click="router.push('/assets')" />
      <van-grid-item icon="bell-o" text="Notifications" @click="router.push('/notifications')" />
      <van-grid-item icon="setting-o" text="Settings" @click="router.push('/settings')" />
    </van-grid>
    
    <!-- Upcoming Events -->
    <van-cell-group inset title="Upcoming Events">
      <van-cell
        v-for="event in upcomingEvents"
        :key="event.id"
        :title="event.title"
        :label="formatDate(event.start_time)"
        is-link
        @click="viewEvent(event.id)"
      />
      <van-empty v-if="upcomingEvents.length === 0" description="No upcoming events" />
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUpcomingEvents } from '@/api/schedule'

const router = useRouter()
const userStore = useUserStore()
const upcomingEvents = ref([])

onMounted(async () => {
  const response = await getUpcomingEvents({ limit: 5 })
  upcomingEvents.value = response.data
})
</script>
```

### 3. Schedule View

```vue
<!-- src/views/schedule/index.vue -->
<template>
  <div class="schedule-page">
    <van-nav-bar title="Schedule" left-arrow @click-left="router.back()" />
    
    <van-calendar v-model="selectedDate" @select="onDateSelect" />
    
    <van-cell-group inset title="Events">
      <van-cell
        v-for="event in events"
        :key="event.id"
        :title="event.title"
        :label="`${event.type} | ${formatTime(event.start_time)} - ${formatTime(event.end_time)}`"
        is-link
        @click="viewEventDetail(event)"
      />
    </van-cell-group>
  </div>
</template>
```

### 4. Profile Management

```vue
<!-- src/views/profile/index.vue -->
<template>
  <div class="profile-page">
    <van-nav-bar title="Profile" left-arrow @click-left="router.back()" />
    
    <van-cell-group inset>
      <van-cell title="Avatar" is-link @click="uploadAvatar">
        <template #right-icon>
          <van-image
            round
            width="50"
            height="50"
            :src="profile.avatar || defaultAvatar"
          />
        </template>
      </van-cell>
      <van-cell title="Name" :value="profile.name" />
      <van-cell title="Email" :value="profile.email" />
      <van-cell title="Phone" :value="profile.phone" is-link @click="editPhone" />
      <van-cell title="Department" :value="profile.department" />
      <van-cell title="Position" :value="profile.position" />
    </van-cell-group>
    
    <div class="button-container">
      <van-button round block type="danger" @click="handleLogout">
        Logout
      </van-button>
    </div>
  </div>
</template>
```

### 5. Assets View

```vue
<!-- src/views/assets/index.vue -->
<template>
  <div class="assets-page">
    <van-nav-bar title="My Assets" left-arrow @click-left="router.back()" />
    
    <van-list v-model:loading="loading" :finished="finished" @load="onLoad">
      <van-card
        v-for="asset in assets"
        :key="asset.id"
        :title="asset.name"
        :desc="asset.category"
        :thumb="assetIcon"
      >
        <template #tags>
          <van-tag type="success">{{ asset.status }}</van-tag>
        </template>
        <template #footer>
          <van-button size="small" type="primary">View Details</van-button>
        </template>
      </van-card>
    </van-list>
  </div>
</template>
```

## Bottom Tab Bar

```vue
<!-- src/components/TabBar.vue -->
<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item icon="home-o" to="/home">Home</van-tabbar-item>
    <van-tabbar-item icon="calendar-o" to="/schedule">Schedule</van-tabbar-item>
    <van-tabbar-item icon="shop-o" to="/assets">Assets</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/profile">Profile</van-tabbar-item>
  </van-tabbar>
</template>
```

## API Integration

```javascript
// src/utils/request.js
import axios from 'axios'
import { showToast } from 'vant'
import { useUserStore } from '@/store/user'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => response.data,
  error => {
    showToast(error.message || 'Network Error')
    return Promise.reject(error)
  }
)

export default service
```

## Router Configuration

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue')
  },
  {
    path: '/home',
    component: () => import('@/views/home/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    component: () => import('@/views/schedule/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/assets',
    component: () => import('@/views/assets/index.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

## Vant Components Used

- `van-nav-bar` - Navigation bar
- `van-tabbar` - Bottom tab navigation
- `van-cell` - List cells
- `van-form`, `van-field` - Forms and inputs
- `van-button` - Buttons
- `van-card` - Asset/item cards
- `van-list` - Infinite scroll list
- `van-calendar` - Date picker
- `van-image` - Images with lazy load
- `van-toast` - Toast notifications
- `van-dialog` - Confirmation dialogs
- `van-empty` - Empty states
- `van-tag` - Status tags

## Capacitor Integration (Future Native Apps)

```json
// capacitor.config.json
{
  "appId": "com.revoerp.mobile",
  "appName": "Revo ERP",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000
    }
  }
}
```

```bash
# Build and add platforms
npm run build
npx cap add android
npx cap add ios

# Sync web assets
npx cap sync

# Open in native IDEs
npx cap open android
npx cap open ios
```

## Build & Deploy

```bash
# Development
npm run dev

# Production build (Web)
npm run build

# Build for native (after web build)
npx cap sync
npx cap open android  # or ios
```

## Mobile Optimization

1. **Viewport**: Configured in index.html
2. **Touch Gestures**: Vant handles touch events
3. **Responsive**: Uses Vant's responsive components
4. **Performance**: Lazy loading, code splitting
5. **PWA**: Can add service worker for offline support

## Security

- Token in localStorage
- Secure API calls
- Input validation
- Session timeout
- Biometric auth (future with Capacitor plugins)

## Future Enhancements

- Push notifications (Capacitor Push)
- Biometric login (Face ID, Touch ID)
- Offline mode (Service Workers)
- Camera integration (Asset photos)
- Geolocation (Check-in with location)
- QR code scanning

## Notes

This mobile app is currently a web application. When native apps are needed, use Capacitor to wrap the web app and access native features like camera, push notifications, and biometric authentication.
