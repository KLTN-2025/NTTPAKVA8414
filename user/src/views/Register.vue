<template>
  <div class="auth-page">
    <h1>Create Your Account</h1>
    <SignUp :routing="'path'" :path="'/register'" />
    <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
  </div>
</template>

<script setup>
import { SignUp } from '@clerk/vue'
</script>