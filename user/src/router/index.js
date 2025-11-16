import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Home.vue'
import Cart from '@/views/Cart.vue'
import Checkout from '@/views/Checkout.vue'
import About from '@/views/About.vue'
import Contact from '@/views/Contact.vue'
import OrderHistory from '@/views/OrderHistory.vue' 
// 1. IMPORT COMPONENT CHI TIẾT ĐƠN HÀNG
import UserOrderDetail from '@/views/UserOrderDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Homepage',
    component: Homepage,
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue'), 
  },
  {
    path: '/product/:id',
    name: 'ProductDetails',
    component: () => import('../views/ProductDetails.vue'),
  },
  {
    path: '/cart',
    name: 'cart',
    component: Cart 
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrderHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: UserOrderDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: Checkout
  },
  {
    path: '/about',
    name: 'about',
    component: About
  },
  {
    path: '/contact',
    name: 'contact',
    component: Contact
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router