<template>
  <header class="w-full bg-white shadow-sm border-b">
      <div class="mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2">
            <span class="text-2xl font-bold text-gray-900">HealthyCrave</span>
          </router-link>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-8">
            <a href="#" class="text-gray-700 hover:text-green-600 transition">Home</a>
            <a href="#" class="text-gray-700 hover:text-green-600 transition">Shop</a>
            <a href="#" class="text-gray-700 hover:text-green-600 transition">About</a>
            <a href="#" class="text-gray-700 hover:text-green-600 transition">Contact</a>
          </nav>

          <!-- Auth & Cart -->
          <div class="flex items-center gap-4">
            <!-- Shopping Cart -->
            <button class="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>

            <!-- UPDATED: Use router-link instead of modal -->
            <SignedOut>
              <div class="flex items-center gap-3">
                <router-link 
                  to="/login"
                  class="px-6 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
                >
                  Sign In
                </router-link>
                <router-link 
                  to="/register"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Sign Up
                </router-link>
              </div>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
</template>

<script setup>
import { SignedIn, SignedOut, UserButton } from '@clerk/vue'
</script>