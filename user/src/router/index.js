import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Homepage',
    component: Homepage,
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue'), // ✅ Trang danh sách sản phẩm
  },
  {
    path: '/product/:id',
    name: 'ProductDetails',
    component: () => import('../views/ProductDetails.vue'),
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