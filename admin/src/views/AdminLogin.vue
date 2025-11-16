<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">

      <h1 class="text-3xl font-bold text-white mb-4">Admin Portal</h1>
      <p class="text-slate-400 mb-8">Sign in to access the dashboard</p>

      <!-- Access Denied -->
      <div v-if="accessDenied" class="bg-red-500/10 border border-red-500 rounded-lg p-6 mb-6">
        <h3 class="text-red-500 font-semibold mb-1">Access Denied</h3>
        <p class="text-red-400 text-sm">You do not have admin privileges.</p>
      </div>

      <!-- Sign In Button -->
      <button 
        v-if="!accessDenied && !isSignedIn" 
        @click="openSignInModal" 
        class="bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
      >
        Click to Sign In
      </button>

      <!-- Loading message while checking admin -->
      <p v-if="isCheckingAccess && isSignedIn" class="text-white mt-4">
        Checking admin access...
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClerk, useAuth } from '@clerk/vue'
import axios from 'axios'

const router = useRouter()
const { isSignedIn, isLoaded, getToken } = useAuth()
const clerk = useClerk()

const accessDenied = ref(false)
const isCheckingAccess = ref(false)

// Open Clerk login modal
const openSignInModal = () => {
  clerk.value.openSignIn()
}

// Watch auth state to check admin access
const checkAdminAccess = async () => {
  if (!isLoaded.value || !isSignedIn.value) return

  isCheckingAccess.value = true

  try {
    console.log('Activate sign-in...')
    const token = await getToken.value()
    if (!token) throw new Error('Token not available')
    console.log(token)


    const response = await axios.get('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = response.data
    if (data?.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      accessDenied.value = true
    }

  } catch (err) {
    console.error('Error verifying admin access:', err)
    accessDenied.value = true
  } finally {
    isCheckingAccess.value = false
  }
}

// Watch for changes in sign-in state
watch([isLoaded, isSignedIn], checkAdminAccess, { immediate: true })
</script>
