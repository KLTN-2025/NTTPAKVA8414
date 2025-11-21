<template>
  <div id="app">
    <Navbar/>
    <main>
      <router-view />
      <Chatbot />
    </main>
    <Footer/>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'; 
import Footer from './components/Footer.vue'; 
import Chatbot from '@/components/Chatbot.vue'
</script>