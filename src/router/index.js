import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useUserStore } from '@/store/user'
import { getToken } from '@/utils/auth'
import TabLayout from '@/layouts/TabLayout.vue'

import Login from '@/views/login/index.vue'
import Dashboard from '@/views/dashboard/index.vue'
import TransactionList from '@/views/accounting/transactions/index.vue'
import TransactionForm from '@/views/accounting/transactions/components/TransactionForm.vue'
import AccountsIndex from '@/views/accounting/accounts/index.vue'
import AccountForm from '@/views/accounting/accounts/components/AccountForm.vue'
import FlowLog from '@/views/accounting/accounts/FlowLog.vue'
import ReportsIndex from '@/views/accounting/reports/index.vue'
import AccountingCategories from '@/views/accounting/categories/index.vue'
import AssetIndex from '@/views/asset/index.vue'
import AssetForm from '@/views/asset/components/AssetForm.vue'
import AssignAsset from '@/views/asset/components/AssignAsset.vue'
import AssetHistory from '@/views/asset/components/AssetHistory.vue'
import AssetCategories from '@/views/asset/categories/index.vue'
import ScheduleIndex from '@/views/schedule/index.vue'
import ScheduleEventsIndex from '@/views/schedule/events/index.vue'
import EventForm from '@/views/schedule/events/components/EventForm.vue'
import MemberIndex from '@/views/member/index.vue'
import RoleIndex from '@/views/role/index.vue'
import MemberForm from '@/views/member/components/MemberForm.vue'
import AssignRole from '@/views/member/components/AssignRole.vue'
import Me from '@/views/me/index.vue'
import Profile from '@/views/profile/index.vue'
import Settings from '@/views/settings/index.vue'
import WorkIndex from '@/views/work/index.vue'
import WorkDashboard from '@/views/work/dashboard/index.vue'
import WorkProjectsIndex from '@/views/work/projects/index.vue'
import ProjectForm from '@/views/work/projects/components/ProjectForm.vue'
import WorkProjectDetail from '@/views/work/projects/detail.vue'
import WorkVendorsIndex from '@/views/work/vendors/index.vue'
import VendorForm from '@/views/work/vendors/components/VendorForm.vue'
import WorkCategoriesIndex from '@/views/work/categories/index.vue'
import WorkCategoryForm from '@/views/work/categories/components/CategoryForm.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
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
        component: Dashboard,
        meta: { title: 'Home', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: TransactionList,
        meta: { title: 'Finance', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'transactions/create',
        name: 'TransactionCreate',
        component: TransactionForm,
        meta: { title: 'Add Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'transactions/:id',
        name: 'TransactionEdit',
        component: TransactionForm,
        meta: { title: 'Edit Transaction', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: AccountsIndex,
        meta: { title: 'Accounts', showTabbar: true, showLayoutHeader:false }
      },
      {
        path: 'accounts/create',
        name: 'AccountCreate',
        component: AccountForm,
        meta: { title: 'Add Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts/:id/flow-log',
        name: 'AccountFlowLog',
        component: FlowLog,
        meta: { title: 'Flow Log', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'accounts/:id',
        name: 'AccountEdit',
        component: AccountForm,
        meta: { title: 'Edit Account', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'reports',
        redirect: '/reports/income-expense'
      },
      {
        path: 'reports/income-expense',
        name: 'ReportsIncomeExpense',
        component: ReportsIndex,
        meta: { title: 'Income vs Expense', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/daily-trends',
        name: 'ReportsDailyTrends',
        component: ReportsIndex,
        meta: { title: 'Daily Trends', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/balance-growth',
        name: 'ReportsBalanceGrowth',
        component: ReportsIndex,
        meta: { title: 'Balance Growth', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/income-by-category',
        name: 'ReportsIncomeByCategory',
        component: ReportsIndex,
        meta: { title: 'Income by Category', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'reports/expense-by-category',
        name: 'ReportsExpenseByCategory',
        component: ReportsIndex,
        meta: { title: 'Expense by Category', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'accounting/categories',
        name: 'AccountingCategories',
        component: AccountingCategories,
        meta: { title: 'Categories', showTabbar: true, backHref: '/transactions', showLayoutHeader: false }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: AssetIndex,
        meta: { title: 'Assets', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'assets/create',
        name: 'AssetCreate',
        component: AssetForm,
        meta: { title: 'Add Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id',
        name: 'AssetEdit',
        component: AssetForm,
        meta: { title: 'Edit Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/assign',
        name: 'AssetAssign',
        component: AssignAsset,
        meta: { title: 'Assign Asset', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/:id/history',
        name: 'AssetHistory',
        component: AssetHistory,
        meta: { title: 'Asset History', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'assets/categories',
        name: 'AssetCategories',
        component: AssetCategories,
        meta: { title: 'Asset Categories', showTabbar: true, backHref: '/assets', showLayoutHeader: false }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: ScheduleIndex,
        meta: { title: 'Schedule', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'schedule/events',
        name: 'ScheduleEvents',
        component: ScheduleEventsIndex,
        meta: { title: 'Events', showTabbar: true, backHref: '/schedule', headerEnd: { to: '/schedule/events/create', icon: 'add' } }
      },
      {
        path: 'schedule/events/create',
        name: 'EventCreate',
        component: EventForm,
        meta: { title: 'Add Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'schedule/events/:id',
        name: 'EventEdit',
        component: EventForm,
        meta: { title: 'Edit Event', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members',
        name: 'Members',
        component: MemberIndex,
        meta: { title: 'Members', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'members/roles',
        name: 'MemberRoles',
        component: RoleIndex,
        meta: { title: 'Member Roles', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'members/create',
        name: 'MemberCreate',
        component: MemberForm,
        meta: { title: 'Add Member', showTabbar: false, backHref: '/members', showLayoutHeader: false }
      },
      {
        path: 'members/:id/assign-role',
        name: 'MemberAssignRole',
        component: AssignRole,
        meta: { title: 'Assign Role', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'members/:id',
        name: 'MemberEdit',
        component: MemberForm,
        meta: { title: 'Edit Member', showTabbar: false, backHref: '/members', showLayoutHeader: false }
      },
      {
        path: 'me',
        name: 'Me',
        component: Me,
        meta: { title: 'Me', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: 'Profile', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { title: 'Settings', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work',
        name: 'Work',
        component: WorkIndex,
        meta: { title: 'Work', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/dashboard',
        name: 'WorkDashboard',
        component: WorkDashboard,
        meta: { title: 'Work Dashboard', showTabbar: true, backHref: '/work', showLayoutHeader: false }
      },
      {
        path: 'work/projects',
        name: 'WorkProjects',
        component: WorkProjectsIndex,
        meta: { title: 'Projects', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/projects/create',
        name: 'WorkProjectCreate',
        component: ProjectForm,
        meta: { title: 'Add Project', showTabbar: false }
      },
      {
        path: 'work/projects/:id',
        name: 'WorkProjectDetail',
        component: WorkProjectDetail,
        meta: { title: 'Project', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/projects/:id/edit',
        name: 'WorkProjectEdit',
        component: ProjectForm,
        meta: { title: 'Edit Project', showTabbar: false }
      },
      {
        path: 'work/vendors',
        name: 'WorkVendors',
        component: WorkVendorsIndex,
        meta: { title: 'Vendors', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/vendors/create',
        name: 'WorkVendorCreate',
        component: VendorForm,
        meta: { title: 'Add Vendor', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/vendors/:id',
        name: 'WorkVendorEdit',
        component: VendorForm,
        meta: { title: 'Edit Vendor', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/categories',
        name: 'WorkCategories',
        component: WorkCategoriesIndex,
        meta: { title: 'Vendor Categories', showTabbar: true, showLayoutHeader: false }
      },
      {
        path: 'work/categories/create',
        name: 'WorkCategoryCreate',
        component: WorkCategoryForm,
        meta: { title: 'Add Category', showTabbar: false, showLayoutHeader: false }
      },
      {
        path: 'work/categories/:id',
        name: 'WorkCategoryEdit',
        component: WorkCategoryForm,
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
