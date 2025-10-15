<!-- src/views/Home.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-green-50 to-white">
    <!-- Header -->
    <header class="w-full bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xl">🥗</span>
            </div>
            <span class="text-2xl font-bold text-gray-900">DietShop</span>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-8">
            <a href="#" class="text-gray-700 hover:text-green-600 transition">Products</a>
            <a href="#" class="text-gray-700 hover:text-green-600 transition">Meal Plans</a>
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

            <!-- Clerk Auth Components -->
            <SignedOut>
              <div class="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button class="px-6 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center">
        <SignedOut>
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Healthy Food, <span class="text-green-600">Delivered Fresh</span>
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your wellness journey today. Sign up to access premium diet meals tailored to your goals.
          </p>
          <div class="flex justify-center gap-4">
            <SignUpButton mode="modal">
              <button class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg">
                Get Started Free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button class="px-8 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-lg">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Welcome Back! 👋
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            You're signed in! Browse our fresh meal options or check your orders.
          </p>
          <div class="flex justify-center gap-4">
            <button class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg">
              Browse Meals
            </button>
            <button class="px-8 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-lg">
              My Orders
            </button>
          </div>
        </SignedIn>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🥑</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Fresh Ingredients</h3>
          <p class="text-gray-600">Sourced daily from local organic farms</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🍽️</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Custom Meals</h3>
          <p class="text-gray-600">Tailored to your dietary preferences</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🚚</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
          <p class="text-gray-600">Same-day delivery in metro areas</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/vue'
</script>