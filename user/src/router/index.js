import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Home.vue'
import Cart from '@/views/Cart.vue' // <-- Bạn đặt tên component là 'Cart'
import Checkout from '@/views/Checkout.vue'
import About from '@/views/About.vue'
import Contact from '@/views/Contact.vue'

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
  path: '/login', 
  name: 'Login',
  component: () => import('../views/Login.vue'),
},
{
  path: '/register', 
  name: 'Register',
  component: () => import('../views/Register.vue'),
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