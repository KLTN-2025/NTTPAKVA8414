<template>
  <div
    class="admin-layout"
    :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
  >
    <nav class="admin-sidebar">
      <div class="sidebar-header">
        <img src="@/assets/images/logo_dark_2.png" alt="Logo" class="logo" />
        <button @click="toggleSidebar" class="collapse-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
      <ul class="nav-links">
        <li>
          <router-link to="/admin/dashboard">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
        </li>

        <li>
          <router-link
            to="/admin/products"
            :class="{
              'active-parent': $route.path.startsWith('/admin/products'),
            }"
          >
            <i class="fa-solid fa-bowl-food"></i> <span>Products</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/orders"
            :class="{
              'active-parent': $route.path.startsWith('/admin/orders'),
            }"
          >
            <i class="fas fa-file-alt"></i>
            <span>Orders</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/inventory"
            :class="{
              'active-parent': $route.path.startsWith('/admin/inventory'),
            }"
          >
            <i class="fa-solid fa-box"></i>
            <span>Inventory</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/suppliers"
            :class="{
              'active-parent':
                $route.path.startsWith('/admin/suppliers') ||
                $route.path.startsWith('/admin/supply-order'),
            }"
          >
            <i class="fa-solid fa-truck"></i>
            <span>Suppliers</span>
          </router-link>
        </li>

        <li>
          <router-link
            to="/admin/transactions"
            :class="{
              'active-parent': $route.path.startsWith('/admin/transactions'),
            }"
          >
            <i class="fa-solid fa-dollar-sign"></i>
            <span>Transactions</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/customers"
            :class="{
              'active-parent': $route.path.startsWith('/admin/customers'),
            }"
          >
            <i class="fas fa-users"></i>
            <span>Customers</span>
          </router-link>
        </li>
        <li>
          <router-link to="/admin/help">
            <i class="fas fa-question-circle"></i>
            <span>Help</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="main-container">
      <header class="admin-topbar">
        <div class="topbar-left">
          <h1>{{ $route.meta.title || "Dashboard" }}</h1>
        </div>
        <div class="topbar-right">
          <button class="topbar-icon-btn">
            <i class="fas fa-bell"></i>
            <span class="notification-badge"></span>
          </button>
          <button class="topbar-icon-btn">
            <i class="fas fa-comment-dots"></i>
          </button>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useClerk, SignedIn, UserButton } from "@clerk/vue";
const clerk = useClerk();

// Logic Sidebar
const isSidebarCollapsed = ref(false);
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
</script>

<style src="./AdminHome.css"></style>
