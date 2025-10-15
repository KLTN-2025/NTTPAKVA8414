<!-- src/views/Regsiter.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Get Started Free</h1>
        <p class="text-gray-600">Create your HealthyCrave account today</p>
      </div>
      
      <SignUp 
        :routing="'path'" 
        :path="'/register'"
        :signInUrl="'/login'"
      />
    </div>
  </div>
</template>

<script setup>
import { SignUp } from '@clerk/vue'
</script>