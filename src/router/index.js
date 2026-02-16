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
        component: () => import('@/views/accounting/transactions/index.vue'),
        meta: { title: 'Finance', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'transactions/create',
        name: 'TransactionCreate',
        component: () => import('@/views/accounting/transactions/components/TransactionForm.vue'),
        meta: { title: 'Add Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'transactions/:id',
        name: 'TransactionEdit',
        component: () => import('@/views/accounting/transactions/components/TransactionForm.vue'),
        meta: { title: 'Edit Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/views/accounting/accounts/index.vue'),
        meta: { title: 'Accounts', showTabbar: true, showLayoutHeader:false }
      },
      {
        path: 'accounts/create',
        name: 'AccountCreate',
        component: () => import('@/views/accounting/accounts/components/AccountForm.vue'),
        meta: { title: 'Add Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts/:id/flow-log',
        name: 'AccountFlowLog',
        component: () => import('@/views/accounting/accounts/FlowLog.vue'),
        meta: { title: 'Flow Log', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts/:id',
        name: 'AccountEdit',
        component: () => import('@/views/accounting/accounts/components/AccountForm.vue'),
        meta: { title: 'Edit Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'reports',
        redirect: '/reports/income-expense'
      },
      {
        path: 'reports/income-expense',
        name: 'ReportsIncomeExpense',
        component: () => import('@/views/accounting/reports/index.vue'),
        meta: { title: 'Income vs Expense', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/daily-trends',
        name: 'ReportsDailyTrends',
        component: () => import('@/views/accounting/reports/index.vue'),
        meta: { title: 'Daily Trends', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/balance-growth',
        name: 'ReportsBalanceGrowth',
        component: () => import('@/views/accounting/reports/index.vue'),
        meta: { title: 'Balance Growth', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/income-by-category',
        name: 'ReportsIncomeByCategory',
        component: () => import('@/views/accounting/reports/index.vue'),
        meta: { title: 'Income by Category', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/expense-by-category',
        name: 'ReportsExpenseByCategory',
        component: () => import('@/views/accounting/reports/index.vue'),
        meta: { title: 'Expense by Category', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'accounting/categories',
        name: 'AccountingCategories',
        component: () => import('@/views/accounting/categories/index.vue'),
        meta: { title: 'Categories', showTabbar: true, backHref: '/transactions', showLayoutHeader: false }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/asset/index.vue'),
        meta: { title: 'Assets', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'assets/create',
        name: 'AssetCreate',
        component: () => import('@/views/asset/components/AssetForm.vue'),
        meta: { title: 'Add Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id',
        name: 'AssetEdit',
        component: () => import('@/views/asset/components/AssetForm.vue'),
        meta: { title: 'Edit Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/assign',
        name: 'AssetAssign',
        component: () => import('@/views/asset/components/AssignAsset.vue'),
        meta: { title: 'Assign Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/history',
        name: 'AssetHistory',
        component: () => import('@/views/asset/components/AssetHistory.vue'),
        meta: { title: 'Asset History', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/categories',
        name: 'AssetCategories',
        component: () => import('@/views/asset/categories/index.vue'),
        meta: { title: 'Asset Categories', showTabbar: true, backHref: '/assets', showLayoutHeader: false }
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
        meta: { title: 'Events', showTabbar: true, backHref: '/schedule', headerEnd: { to: '/schedule/events/create', icon: 'add' } }
      },
      {
        path: 'schedule/events/create',
        name: 'EventCreate',
        component: () => import('@/views/schedule/events/components/EventForm.vue'),
        meta: { title: 'Add Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'schedule/events/:id',
        name: 'EventEdit',
        component: () => import('@/views/schedule/events/components/EventForm.vue'),
        meta: { title: 'Edit Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/member/index.vue'),
        meta: { title: 'Members', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'members/roles',
        name: 'MemberRoles',
        component: () => import('@/views/role/index.vue'),
        meta: { title: 'Member Roles', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'members/create',
        name: 'MemberCreate',
        component: () => import('@/views/member/components/MemberForm.vue'),
        meta: { title: 'Add Member', showTabbar: false, backHref: '/members', showLayoutHeader: false }
      },
      {
        path: 'members/:id/assign-role',
        name: 'MemberAssignRole',
        component: () => import('@/views/member/components/AssignRole.vue'),
        meta: { title: 'Assign Role', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members/:id',
        name: 'MemberEdit',
        component: () => import('@/views/member/components/MemberForm.vue'),
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
        meta: { title: 'Profile', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: 'Settings', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'pending-sync',
        name: 'PendingSync',
        component: () => import('@/views/sync/PendingSync.vue'),
        meta: { title: 'Pending Sync', showTabbar: false }
      },
      {
        path: 'work',
        name: 'Work',
        component: () => import('@/views/work/index.vue'),
        meta: { title: 'Work', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/dashboard',
        name: 'WorkDashboard',
        component: () => import('@/views/work/dashboard/index.vue'),
        meta: { title: 'Work Dashboard', showTabbar: true, backHref: '/work', showLayoutHeader: false }
      },
      {
        path: 'work/projects',
        name: 'WorkProjects',
        component: () => import('@/views/work/projects/index.vue'),
        meta: { title: 'Projects', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/projects/create',
        name: 'WorkProjectCreate',
        component: () => import('@/views/work/projects/components/ProjectForm.vue'),
        meta: { title: 'Add Project', showTabbar: false }
      },
      {
        path: 'work/projects/:id',
        name: 'WorkProjectDetail',
        component: () => import('@/views/work/projects/detail.vue'),
        meta: { title: 'Project', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/projects/:id/edit',
        name: 'WorkProjectEdit',
        component: () => import('@/views/work/projects/components/ProjectForm.vue'),
        meta: { title: 'Edit Project', showTabbar: false }
      },
      {
        path: 'work/vendors',
        name: 'WorkVendors',
        component: () => import('@/views/work/vendors/index.vue'),
        meta: { title: 'Vendors', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/vendors/create',
        name: 'WorkVendorCreate',
        component: () => import('@/views/work/vendors/components/VendorForm.vue'),
        meta: { title: 'Add Vendor', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/vendors/:id',
        name: 'WorkVendorEdit',
        component: () => import('@/views/work/vendors/components/VendorForm.vue'),
        meta: { title: 'Edit Vendor', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/categories',
        name: 'WorkCategories',
        component: () => import('@/views/work/categories/index.vue'),
        meta: { title: 'Vendor Categories', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/categories/create',
        name: 'WorkCategoryCreate',
        component: () => import('@/views/work/categories/components/CategoryForm.vue'),
        meta: { title: 'Add Category', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/categories/:id',
        name: 'WorkCategoryEdit',
        component: () => import('@/views/work/categories/components/CategoryForm.vue'),
        meta: { title: 'Edit Category', showTabbar: false, showLayoutHeader: false }
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
