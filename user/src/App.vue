<template>
  <div id="app" class="flex flex-col min-h-screen w-screen">
    <Navbar/>
    
    <main id="main-content" class="flex-grow">
      <router-view />
    </main>

    <Footer/>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue'
</script>

<style>
/* Reset cơ bản */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Thêm màu nền để tránh bị trong suốt khi backdrop-blur */
  background-color: #ffffff; 
}
</style>