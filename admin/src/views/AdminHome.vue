<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <nav class="admin-sidebar">
      <div class="sidebar-header">
        <img src="@/assets/images/logo.jpg" alt="Logo" class="logo" />
        <button @click="toggleSidebar" class="collapse-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
      
      <div class="nav-section-title">GENERAL</div>
      <ul class="nav-links">
        <li>
          <router-link to="/">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
        </li>
        
        <li>
          <router-link to="/products" :class="{ 'active-parent': $route.path.startsWith('/products') }">
            <i class="fas fa-box"></i>
            <span>Product</span>
          </router-link>
        </li>

        <li>
          <router-link to="/orders">
            <i class="fas fa-file-alt"></i>
            <span>Orders</span>
          </router-link>
        </li>
        <li>
          <router-link to="/customers">
            <i class="fas fa-users"></i>
            <span>Customers</span>
          </router-link>
        </li>
         <li>
          <router-link to="/sales-report">
            <i class="fas fa-chart-line"></i>
            <span>Sales Report</span>
          </router-link>
        </li>
      </ul>
      
      <div class="nav-section-title">TOOLS</div>
      <ul class="nav-links">
        <li>
          <router-link to="/settings">
            <i class="fas fa-cog"></i>
            <span>Account & Settings</span>
          </router-link>
        </li>
         <li>
          <router-link to="/help">
            <i class="fas fa-question-circle"></i>
            <span>Help</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="main-container">
      
      <header class="admin-topbar">
        <div class="search-bar-wrapper">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search product..." />
        </div>
        
        <div class="topbar-right">
          <button class="topbar-icon-btn">
            <i class="fas fa-bell"></i>
            <span class="notification-badge"></span>
          </button>
          <button class="topbar-icon-btn">
            <i class="fas fa-comment-dots"></i>
          </button>
          
          <div class="admin-profile">
            <img src="https://via.placeholder.com/40" alt="Admin" />
            <div class="admin-info">
              <span class="admin-name">Guy Hawkins</span>
              <span class="admin-role">Admin</span>
            </div>
          </div>
        </div>
      </header>
      
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css';

// Logic Sidebar
const isSidebarCollapsed = ref(false);
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}


</script>

<style src="./AdminHome.css"></style>