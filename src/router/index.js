import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useUserStore } from '@/store/user'
import { getToken } from '@/utils/auth'
import TabLayout from '@/layouts/TabLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { showTabbar: false, public: true }
  },
  {
    path: '/',
    component: TabLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: 'Home', showTabbar: true }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/transactions/index.vue'),
        meta: { title: 'Finance', showTabbar: true }
      },
      {
        path: 'transactions/create',
        name: 'TransactionCreate',
        component: () => import('@/views/transactions/TransactionForm.vue'),
        meta: { title: 'Add Transaction', showTabbar: false }
      },
      {
        path: 'transactions/:id',
        name: 'TransactionEdit',
        component: () => import('@/views/transactions/TransactionForm.vue'),
        meta: { title: 'Edit Transaction', showTabbar: false }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/views/accounts/index.vue'),
        meta: { title: 'Accounts', showTabbar: false }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/index.vue'),
        meta: { title: 'Reports', showTabbar: false }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/assets/index.vue'),
        meta: { title: 'Assets', showTabbar: true }
      },
      {
        path: 'assets/create',
        name: 'AssetCreate',
        component: () => import('@/views/assets/AssetForm.vue'),
        meta: { title: 'Add Asset', showTabbar: false }
      },
      {
        path: 'assets/:id',
        name: 'AssetEdit',
        component: () => import('@/views/assets/AssetForm.vue'),
        meta: { title: 'Edit Asset', showTabbar: false }
      },
      {
        path: 'assets/:id/assign',
        name: 'AssetAssign',
        component: () => import('@/views/assets/AssignAsset.vue'),
        meta: { title: 'Assign Asset', showTabbar: false }
      },
      {
        path: 'assets/:id/history',
        name: 'AssetHistory',
        component: () => import('@/views/assets/AssetHistory.vue'),
        meta: { title: 'Asset History', showTabbar: false }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/schedule/index.vue'),
        meta: { title: 'Schedule', showTabbar: true }
      },
      {
        path: 'schedule/events',
        name: 'ScheduleEvents',
        component: () => import('@/views/schedule/events/index.vue'),
        meta: { title: 'Events', showTabbar: false }
      },
      {
        path: 'schedule/events/create',
        name: 'EventCreate',
        component: () => import('@/views/schedule/events/EventForm.vue'),
        meta: { title: 'Add Event', showTabbar: false }
      },
      {
        path: 'schedule/events/:id',
        name: 'EventEdit',
        component: () => import('@/views/schedule/events/EventForm.vue'),
        meta: { title: 'Edit Event', showTabbar: false }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/index.vue'),
        meta: { title: 'Members', showTabbar: false }
      },
      {
        path: 'members/create',
        name: 'MemberCreate',
        component: () => import('@/views/members/MemberForm.vue'),
        meta: { title: 'Add Member', showTabbar: false }
      },
      {
        path: 'members/:id/assign-role',
        name: 'MemberAssignRole',
        component: () => import('@/views/members/AssignRole.vue'),
        meta: { title: 'Assign Role', showTabbar: false }
      },
      {
        path: 'members/:id',
        name: 'MemberEdit',
        component: () => import('@/views/members/MemberForm.vue'),
        meta: { title: 'Edit Member', showTabbar: false }
      },
      {
        path: 'me',
        name: 'Me',
        component: () => import('@/views/me/index.vue'),
        meta: { title: 'Me', showTabbar: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: 'Profile', showTabbar: false }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: 'Settings', showTabbar: false }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      const userStore = useUserStore()
      const hasRoles = userStore.role

      if (hasRoles) {
        next()
      } else {
        try {
          await userStore.getInfo()
          next()
        } catch (error) {
          await userStore.resetState()
          next(`/login?redirect=${encodeURIComponent(to.path)}`)
        }
      }
    }
  } else {
    if (to.path === '/login' || to.meta?.public) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.path)}`)
    }
  }
})

export default router
