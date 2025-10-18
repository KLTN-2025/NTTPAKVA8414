import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Homepage',
    component: Homepage,
  },
  {
    path: '/login/:pathMatch(.*)*',      //Handle Clerk routing
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register/:pathMatch(.*)*',  //Handle Clerk routing
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
