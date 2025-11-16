//src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@clerk/vue'

import { watch } from 'vue'
import axios from 'axios'

import AdminLogin from '@/views/AdminLogin.vue'
import AdminHome from '@/views/AdminHome.vue'
import Dashboard from '@/views/Dashboard.vue'
import ProductList from '@/views/ProductList.vue'
import OrderList from '@/views/OrderList.vue' 

const ProductForm = () => import('@/views/ProductForm.vue') 
const OrderDetailView = () => import('@/views/OrderDetailView.vue') 
const OrderForm = () => import('@/views/OrderForm.vue') 

const CustomerList = () => import('@/views/CustomerList.vue')
const SalesReport = () => import('@/views/SalesReport.vue')
const Settings = () => import('@/views/Settings.vue')
const Help = () => import('@/views/Help.vue')


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: AdminLogin,
    meta: { requiresGuest: true, title: 'Login' }
  },
  {
    path: '/admin',
    component: AdminHome,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard', 
        name: 'dashboard',
        component: Dashboard,
        meta: { requireAdmin: true, title: 'Dashboard' }
      },
      {
        path: 'products',
        name: 'admin-products',
        component: ProductList,
        meta: { requireAdmin: true, title: 'Product Management' }
      },
      {
        path: 'products/new',
        name: 'admin-product-new',
        component: ProductForm,
        meta: { requireAdmin: true, title: 'Add New Product' }
      },
      {
        path: 'products/edit/:id', 
        name: 'admin-product-edit',
        component: ProductForm,     
        meta: { requireAdmin: true, title: 'Edit Product' }
      },
      {
        path: 'products/view/:id', 
        name: 'admin-product-view',
        component: ProductForm,
        meta: { requireAdmin: true, title: 'Product Details' }
      },
      
      {
        path: 'orders',
        name: 'admin-orders',
        component: OrderList,
        meta: { requireAdmin: true, title: 'Order Management' }
      },
      {
        path: 'orders/edit/:id',
        name: 'admin-order-edit',
        component: OrderForm,
        meta: { requireAdmin: true, title: 'Edit Order' }
      },
      {
        path: 'orders/view/:id',
        name: 'admin-order-view',
        component: OrderDetailView,
        meta: { requireAdmin: true, title: 'Order Details' }
      },
      {
        path: 'customers',
        name: 'admin-customers',
        component: CustomerList,
        meta: { requireAdmin: true, title: 'Customers' }
      },
      {
        path: 'sales-report',
        name: 'admin-sales-report',
        component: SalesReport,
        meta: { requireAdmin: true, title: 'Sales Report' }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: Settings,
        meta: { requireAdmin: true, title: 'Account & Settings' }
      },
      {
        path: 'help',
        name: 'admin-help',
        component: Help,
        meta: { requireAdmin: true, title: 'Help' }
      }
    ]
  },
  {
    path: '/',
    redirect: 'login'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded.value) {
    await new Promise(resolve => {
      const unwatch = watch(isLoaded, (loaded) => {
        if (loaded) {
          unwatch()
          resolve()
        }
      })
    })
  }
  if (to.meta.requireAdmin && !isSignedIn.value) {
    return next('/login')
  }

  if (to.meta.requiresGuest && isSignedIn.value) {
    return next('/admin/dashboard')
  }
  
  next()
})
export default router