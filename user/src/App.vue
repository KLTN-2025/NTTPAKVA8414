<!-- src/App.vue -->
<template>
  <div id="app" class="w-screen min-h-screen">
    <Navbar/>
    <div id="main-content" class="flex justify-center">
      <router-view />
    </div>
    <Footer/>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue'

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