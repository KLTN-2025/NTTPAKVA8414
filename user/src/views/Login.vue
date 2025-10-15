<template>
  <div class="auth-page">
    <h1>Sign In to Your Account</h1>
    <SignIn :routing="'path'" :path="'/login'" />
    <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
  </div>
</template>

<script setup>
import { SignIn } from '@clerk/vue'
</script>