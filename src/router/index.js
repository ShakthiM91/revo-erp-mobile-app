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
        meta: { title: 'Home', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/transactions/index.vue'),
        meta: { title: 'Finance', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'transactions/create',
        name: 'TransactionCreate',
        component: () => import('@/views/transactions/TransactionForm.vue'),
        meta: { title: 'Add Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'transactions/:id',
        name: 'TransactionEdit',
        component: () => import('@/views/transactions/TransactionForm.vue'),
        meta: { title: 'Edit Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/views/accounts/index.vue'),
        meta: { title: 'Accounts', showTabbar: false, showLayoutHeader:false }
      },
      {
        path: 'accounts/create',
        name: 'AccountCreate',
        component: () => import('@/views/accounts/AccountForm.vue'),
        meta: { title: 'Add Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts/:id',
        name: 'AccountEdit',
        component: () => import('@/views/accounts/AccountForm.vue'),
        meta: { title: 'Edit Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/index.vue'),
        meta: { title: 'Reports', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounting/categories',
        name: 'AccountingCategories',
        component: () => import('@/views/accounting/categories/index.vue'),
        meta: { title: 'Categories', showTabbar: false, backHref: '/transactions', showLayoutHeader: false }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/assets/index.vue'),
        meta: { title: 'Assets', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'assets/create',
        name: 'AssetCreate',
        component: () => import('@/views/assets/AssetForm.vue'),
        meta: { title: 'Add Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id',
        name: 'AssetEdit',
        component: () => import('@/views/assets/AssetForm.vue'),
        meta: { title: 'Edit Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/assign',
        name: 'AssetAssign',
        component: () => import('@/views/assets/AssignAsset.vue'),
        meta: { title: 'Assign Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/history',
        name: 'AssetHistory',
        component: () => import('@/views/assets/AssetHistory.vue'),
        meta: { title: 'Asset History', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/categories',
        name: 'AssetCategories',
        component: () => import('@/views/assets/categories/index.vue'),
        meta: { title: 'Asset Categories', showTabbar: false, backHref: '/assets', showLayoutHeader: false }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/schedule/index.vue'),
        meta: { title: 'Schedule', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'schedule/events',
        name: 'ScheduleEvents',
        component: () => import('@/views/schedule/events/index.vue'),
        meta: { title: 'Events', showTabbar: false, backHref: '/schedule', headerEnd: { to: '/schedule/events/create', icon: 'add' } }
      },
      {
        path: 'schedule/events/create',
        name: 'EventCreate',
        component: () => import('@/views/schedule/events/EventForm.vue'),
        meta: { title: 'Add Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'schedule/events/:id',
        name: 'EventEdit',
        component: () => import('@/views/schedule/events/EventForm.vue'),
        meta: { title: 'Edit Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/index.vue'),
        meta: { title: 'Members', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members/roles',
        name: 'MemberRoles',
        component: () => import('@/views/roles/index.vue'),
        meta: { title: 'Member Roles', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members/create',
        name: 'MemberCreate',
        component: () => import('@/views/members/MemberForm.vue'),
        meta: { title: 'Add Member', showTabbar: false, backHref: '/members', showLayoutHeader: false }
      },
      {
        path: 'members/:id/assign-role',
        name: 'MemberAssignRole',
        component: () => import('@/views/members/AssignRole.vue'),
        meta: { title: 'Assign Role', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members/:id',
        name: 'MemberEdit',
        component: () => import('@/views/members/MemberForm.vue'),
        meta: { title: 'Edit Member', showTabbar: false, backHref: '/members', showLayoutHeader: false }
      },
      {
        path: 'me',
        name: 'Me',
        component: () => import('@/views/me/index.vue'),
        meta: { title: 'Me', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: 'Profile', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: 'Settings', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work',
        name: 'Work',
        component: () => import('@/views/work/index.vue'),
        meta: { title: 'Work', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/projects',
        name: 'WorkProjects',
        component: () => import('@/views/work/projects/index.vue'),
        meta: { title: 'Projects', showTabbar: false, backHref: '/work', headerEnd: { to: '/work/projects/create', icon: 'add' } }
      },
      {
        path: 'work/projects/create',
        name: 'WorkProjectCreate',
        component: () => import('@/views/work/projects/ProjectForm.vue'),
        meta: { title: 'Add Project', showTabbar: false }
      },
      {
        path: 'work/projects/:id',
        name: 'WorkProjectDetail',
        component: () => import('@/views/work/projects/detail.vue'),
        meta: { title: 'Project', showTabbar: false }
      },
      {
        path: 'work/projects/:id/edit',
        name: 'WorkProjectEdit',
        component: () => import('@/views/work/projects/ProjectForm.vue'),
        meta: { title: 'Edit Project', showTabbar: false }
      },
      {
        path: 'work/vendors',
        name: 'WorkVendors',
        component: () => import('@/views/work/vendors/index.vue'),
        meta: { title: 'Vendors', showTabbar: false, backHref: '/work', headerEnd: { to: '/work/vendors/create', icon: 'add' } }
      },
      {
        path: 'work/vendors/create',
        name: 'WorkVendorCreate',
        component: () => import('@/views/work/vendors/VendorForm.vue'),
        meta: { title: 'Add Vendor', showTabbar: false }
      },
      {
        path: 'work/vendors/:id',
        name: 'WorkVendorEdit',
        component: () => import('@/views/work/vendors/VendorForm.vue'),
        meta: { title: 'Edit Vendor', showTabbar: false }
      },
      {
        path: 'work/categories',
        name: 'WorkCategories',
        component: () => import('@/views/work/categories/index.vue'),
        meta: { title: 'Vendor Categories', showTabbar: false, backHref: '/work', showLayoutHeader: false }
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
