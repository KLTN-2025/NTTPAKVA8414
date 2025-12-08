<!-- views/InventoryTracking.vue -->
<template>
  <div class="inventory-page">
    <!-- Toolbar: Search, Filter, Sort, Create Button -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- Search Box -->
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Search by SKU or product name..."
          />
        </div>

        <!-- Stock Status Filter -->
        <select v-model="stockStatusFilter" @change="fetchInventory(1)" class="filter-select">
          <option value="">All Stock Status</option>
          <option value="normal">Normal (> 10)</option>
          <option value="low-stock">Low Stock (1-10)</option>
          <option value="out-of-stock">Out of Stock (0)</option>
        </select>

        <!-- Sort Options -->
        <select v-model="sortOption" @change="fetchInventory(1)" class="sort-select">
          <option value="stock-asc">Stock: Low to High</option>
          <option value="stock-desc">Stock: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <div class="toolbar-right">
        <!-- Create New Supply Order Button -->
        <router-link to="/admin/supply-orders/new" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Create New Supply Order
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading inventory...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="table-container">
      <div class="error-container">
        <h2>Error Loading Inventory</h2>
        <p>{{ error }}</p>
        <button @click="fetchInventory(1)" class="btn btn-primary">
          Try Again
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div v-else class="table-container">
      <!-- Empty State -->
      <div v-if="products.length === 0" class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>No Products Found</h3>
        <p>No products match your search criteria.</p>
      </div>

      <!-- Products Table -->
      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="font-size: 14px; font-weight: 500;" class="col-sku">SKU</th>
            <th style="font-size: 14px; font-weight: 500;" class="col-name">Product Name</th>
            <th style="font-size: 14px; font-weight: 500;" class="col-stock">Stock Quantity</th>
            <th style="font-size: 14px; font-weight: 500;" class="col-status">Stock Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product._id">
            <td style="font-weight: bold;" class="col-sku">{{ product.sku }}</td>
            <td style="font-size: 1rem;" class="col-name">{{ product.name }}</td>
            <td style="font-weight: bold;" class="col-stock">{{ product.stock }}</td>
            <td class="col-status">
              <span :class="['status-badge', getStatusClass(product.stockStatus)]">
                {{ formatStatus(product.stockStatus) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="products.length > 0" class="pagination-container">
        <div class="pagination-info">
          {{ paginationInfo }}
        </div>
        <div class="pagination-controls">
          <span>Page</span>
          <select v-model="currentPage" @change="fetchInventory(currentPage)" class="page-select">
            <option v-for="page in totalPages" :key="page" :value="page">
              {{ page }}
            </option>
          </select>
          <button
            class="page-btn"
            :disabled="!pagination.has_prev_page"
            @click="fetchInventory(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            class="page-btn"
            :disabled="!pagination.has_next_page"
            @click="fetchInventory(currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()

// State
const products = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const stockStatusFilter = ref('')
const sortOption = ref('stock-asc')
const currentPage = ref(1)
const pagination = ref({
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 0,
  has_next_page: false,
  has_prev_page: false
})

// Debounce timer
let searchTimeout = null

// Computed
const totalPages = computed(() => pagination.value.total_pages || 1)

const paginationInfo = computed(() => {
  const start = (pagination.value.current_page - 1) * pagination.value.per_page + 1
  const end = Math.min(
    pagination.value.current_page * pagination.value.per_page,
    pagination.value.total_items
  )
  return `${start} - ${end} of ${pagination.value.total_items} products`
})

// Methods
function getStatusClass(status) {
  switch (status) {
    case 'normal':
      return 'status-normal'
    case 'low-stock':
      return 'status-low-stock'
    case 'out-of-stock':
      return 'status-out-of-stock'
    default:
      return ''
  }
}

function formatStatus(status) {
  switch (status) {
    case 'normal':
      return 'Normal'
    case 'low-stock':
      return 'Low Stock'
    case 'out-of-stock':
      return 'Out of Stock'
    default:
      return status
  }
}

function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchInventory(1)
  }, 300)
}

async function fetchInventory(page = 1) {
  loading.value = true
  error.value = null

  try {
    const token = await getToken.value()
    
    // Parse sort option
    const [sortBy, sortOrder] = sortOption.value.split('-')

    const params = {
      page,
      limit: 10,
      sortBy,
      sortOrder
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (stockStatusFilter.value) {
      params.stock_status = stockStatusFilter.value
    }

    const response = await axios.get('/api/admin/inventory', {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (response.data.success) {
      products.value = response.data.data
      pagination.value = response.data.pagination
      currentPage.value = response.data.pagination.current_page
    } else {
      throw new Error(response.data.message || 'Failed to fetch inventory')
    }
  } catch (err) {
    console.error('Error fetching inventory:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to load inventory'
    products.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchInventory(1)
})
</script>

<style scoped src="@/styling/InventoryTracking.css"></style>