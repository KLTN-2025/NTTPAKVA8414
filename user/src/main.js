import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import Toast, { useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(clerkPlugin, {
    publishableKey: 'pk_test_cnVsaW5nLWNhbWVsLTQ2LmNsZXJrLmFjY291bnRzLmRldiQ',
    signInForceRedirectUrl: '/login'
})
app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  showCloseButtonOnHover: false,
})
app.mount('#app')