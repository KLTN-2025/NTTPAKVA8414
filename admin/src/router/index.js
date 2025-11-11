//src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
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
    path: '/',
    component: AdminHome,
    children: [
      {
        path: '', 
        name: 'dashboard',
        component: Dashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: '/products',
        name: 'admin-products',
        component: ProductList,
        meta: { title: 'Product Management' }
      },
      {
        path: '/products/new',
        name: 'admin-product-new',
        component: ProductForm,
        meta: { title: 'Add New Product' }
      },
      {
        path: '/products/edit/:id', 
        name: 'admin-product-edit',
        component: ProductForm,     
        meta: { title: 'Edit Product' }
      },
      {
        path: '/products/view/:id', 
        name: 'admin-product-view',
        component: ProductForm,
        meta: { title: 'Product Details' }
      },
      
      {
        path: '/orders',
        name: 'admin-orders',
        component: OrderList,
        meta: { title: 'Order Management' }
      },
      {
        path: '/orders/new',
        name: 'admin-order-new',
        component: OrderForm,
        meta: { title: 'New Order' }
      },
      {
        path: '/orders/edit/:id',
        name: 'admin-order-edit',
        component: OrderForm,
        meta: { title: 'Edit Order' }
      },
      {
        path: '/orders/view/:id',
        name: 'admin-order-view',
        component: OrderDetailView,
        meta: { title: 'Order Details' }
      },
      {
        path: '/customers',
        name: 'admin-customers',
        component: CustomerList,
        meta: { title: 'Customers' }
      },
      {
        path: '/sales-report',
        name: 'admin-sales-report',
        component: SalesReport,
        meta: { title: 'Sales Report' }
      },
      {
        path: '/settings',
        name: 'admin-settings',
        component: Settings,
        meta: { title: 'Account & Settings' }
      },
      {
        path: '/help',
        name: 'admin-help',
        component: Help,
        meta: { title: 'Help' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router