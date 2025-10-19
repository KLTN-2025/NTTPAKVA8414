import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(clerkPlugin, {
    publishableKey: 'pk_test_cnVsaW5nLWNhbWVsLTQ2LmNsZXJrLmFjY291bnRzLmRldiQ'
})
app.use(createPinia())
app.use(router)

app.mount('#app')