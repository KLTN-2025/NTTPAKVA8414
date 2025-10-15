<!-- src/App.vue -->
<template>
  <div id="app" class="w-full min-h-screen">
    <router-view />
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useUser } from '@clerk/vue'
import { useAuthSync } from '@/composables/authSync'

const { isLoaded, isSignedIn } = useUser()
const { syncUser } = useAuthSync()

onMounted(() => {
  watch(
    [() => isLoaded.value, () => isSignedIn.value],
    async ([loaded, signedIn]) => {
      if (loaded && signedIn) {
        try {
          await syncUser()
          console.log('✅ User synced automatically on app load/login')
        } catch (err) {
          console.error('❌ Sync failed:', err)
        }
      }
    },
    { immediate: true }
  )
})
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>