<template>
  <header>
    <div>
      <!-- Logo -->
     <router-link to="/" class="flex items-center gap-2 logo">
  <img 
    src="@/assets/images/logo.jpg" 
    alt="Logo" 
    class="h-10 w-auto md:h-10 transition-transform duration-200" />
</router-link>

      <!-- Navigation -->
     <nav class="hidden md:flex items-center gap-8">
  <router-link to="/" class="text-gray-700 hover:text-green-600 transition">Home</router-link>
  <router-link to="/products" class="text-gray-700 hover:text-green-600 transition">Shop</router-link>
  <router-link to="/about" class="text-gray-700 hover:text-green-600 transition">About</router-link>
  <router-link to="/contact" class="text-gray-700 hover:text-green-600 transition">Contact</router-link>
</nav>

      <!-- Auth & Cart -->
      <div class="auth-cart">
        <!-- Cart -->
        <button class="cart-btn">
          <svg class="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="cart-badge">3</span>
        </button>

        <SignedOut>
          <div class="flex items-center gap-3">
            <router-link to="/login" class="btn-login">Sign In</router-link>
            <router-link to="/register" class="btn-signup">Sign Up</router-link>
          </div>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  </header>
</template>

<script setup>
import { SignedIn, SignedOut, UserButton } from '@clerk/vue'
import './Navbar.css'
</script>