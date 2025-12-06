<!--src/views/OrderHistory.vue-->
<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="My Orders Banner" class="cart-banner-img" />
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>My Orders</strong>
      </nav>
    </div>
  </div>

  <div v-if="isLoggedIn" class="order-history-container">
    <h1 class="page-title">My Orders</h1>

    <!-- FILTERS SECTION -->
    <div class="filters-container">
      <div class="filter-group">
        <label for="order-status">Order Status:</label>
        <select id="order-status" v-model="filters.order_status" @change="applyFilters">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="payment-status">Payment Status:</label>
        <select id="payment-status" v-model="filters.payment_status" @change="applyFilters">
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="date-begin">From Date:</label>
        <input 
          type="date" 
          id="date-begin" 
          v-model="filters.dateBegin"
          @change="applyFilters"
        />
      </div>

      <div class="filter-group">
        <label for="date-end">To Date:</label>
        <input 
          type="date" 
          id="date-end" 
          v-model="filters.dateEnd"
          @change="applyFilters"
        />
      </div>

      <button @click="clearFilters" class="btn btn-clear">Clear Filters</button>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading your orders...</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchOrders" class="btn btn-retry">Try Again</button>
    </div>

    <!-- ORDERS TABLE -->
    <div v-else class="table-container">
      <table class="order-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order._id">
            
            <td>
              <div class="product-cell">
                <img 
                  :src="buildImagePath(order.previewProduct?.image) || defaultImage" 
                  :alt="order.previewProduct?.name || 'Order'"
                  @error="handleImageError"
                />
                <div class="product-info">
                  <span class="order-id">#{{ formatOrderId(order._id) }}</span>
                  <span class="product-name">
                    {{ order.previewProduct?.name || 'Order' }}
                    <span v-if="order.itemCount > 1">({{ order.itemCount }} items)</span>
                  </span>
                </div>
              </div>
            </td>

            <td data-label="Date">{{ formatDate(order.order_date) }}</td>
            <td data-label="Status">
              <span class="status-badge" :class="getStatusClass(order.order_status)">
                {{ formatStatus(order.order_status) }}
              </span>
            </td>
            <td data-label="Total">{{ formatPrice(order.total_amount) }}</td>
            <td data-label="Actions">
              <router-link :to="`/orders/${order._id}`" class="btn btn-view-details">
                View Details
              </router-link>
            </td>
          </tr>

          <tr v-if="orders.length === 0" class="empty-orders">
            <td colspan="5">
              <p>You haven't placed any orders yet.</p>
              <router-link to="/products" class="btn btn-shop-now">Shop Now</router-link>
            </td>
          </tr>

        </tbody>
      </table>

      <!-- PAGINATION -->
      <div v-if="pagination.totalPages > 1" class="pagination-container">
        <button 
          @click="goToPage(pagination.currentPage - 1)"
          :disabled="!pagination.hasPrevPage"
          class="btn btn-pagination"
        >
          <i class="fas fa-chevron-left"></i> Previous
        </button>

        <div class="page-info">
          Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
          <span class="total-items">({{ pagination.totalItems }} orders)</span>
        </div>

        <button 
          @click="goToPage(pagination.currentPage + 1)"
          :disabled="!pagination.hasNextPage"
          class="btn btn-pagination"
        >
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

  </div>
  <div v-else class="order-history-container">
    <h1 style="justify-content: center; align-items: center;">Please log in to see your orders.</h1>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { isSignedIn, getToken } = useAuth()
import '@fortawesome/fontawesome-free/css/all.min.css'

import { formatDate, formatPrice, buildImagePath } from '@/utilities/helper'

const router = useRouter()
const isLoggedIn = computed(() => isSignedIn.value)

// State
const orders = ref([])
const loading = ref(false)
const error = ref(null)
const defaultImage = 'https://via.placeholder.com/40/cccccc/666666?text=No+Image'

// Filters
const filters = reactive({
  order_status: '',
  payment_status: '',
  dateBegin: '',
  dateEnd: ''
})

// Pagination
const pagination = reactive({
  currentPage: 1,
  perPage: 5,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
})

// Fetch orders from API
async function fetchOrders() {
  if (!isSignedIn)
    return
  loading.value = true
  error.value = null

  try {
    // Build query parameters
    const params = {
      page: pagination.currentPage,
      limit: pagination.perPage
    }
    const token = await getToken.value()

    // Add filters if they exist
    if (filters.order_status) params.order_status = filters.order_status
    if (filters.payment_status) params.payment_status = filters.payment_status
    if (filters.dateBegin) params.dateBegin = filters.dateBegin
    if (filters.dateEnd) params.dateEnd = filters.dateEnd

    const response = await axios.get('/api/orders', {
      params,
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`    
      }
    })

    const data = response.data

    if (data.success) {
      orders.value = data.data
      Object.assign(pagination, data.pagination)
    } else {
      throw new Error(data.message || 'Failed to fetch orders')
    }

  } catch (err) {
    console.error('Error fetching orders:', err)
    if (err.response) {
      error.value = err.response.data.message || 'Failed to load orders. Please try again.'
    } else if (err.request) {
      error.value = 'Network error. Please check your connection.'
    } else {
      error.value = err.message || 'Failed to load orders. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Apply filters and reset to page 1
function applyFilters() {
  pagination.currentPage = 1
  fetchOrders()
}

// Clear all filters
function clearFilters() {
  filters.order_status = ''
  filters.payment_status = ''
  filters.dateBegin = ''
  filters.dateEnd = ''
  pagination.currentPage = 1
  fetchOrders()
}

// Navigate to specific page
function goToPage(page) {
  if (page < 1 || page > pagination.totalPages) return
  pagination.currentPage = page
  fetchOrders()
}

// Format order ID (show last 6 characters)
function formatOrderId(id) {
  return id.slice(-6).toUpperCase()
}

// Format status text (capitalize first letter)
function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Get status badge CSS class
function getStatusClass(status) {
  const statusMap = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'shipped': 'shipping',
    'delivered': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || ''
}

// Handle image load errors
function handleImageError(event) {
  event.target.src = defaultImage
}

// Load orders on component mount
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped src="../styling/OrderHistory.css"></style>