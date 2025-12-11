<!--views/OrderDetailView.vue-->
<template>
  <div class="order-detail-page">
    <nav class="form-breadcrumbs">
      <router-link to="/admin/dashboard">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/admin/orders">Orders</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>Order Details</strong>
    </nav>

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading order details...</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-container">
      <h2>{{ error }}</h2>
      <p>We couldn't load the order details. Please try again.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
        <button @click="fetchOrderDetails" class="btn btn-secondary">Try Again</button>
        <router-link to="/admin/orders" class="btn btn-primary">Back to Orders</router-link>
      </div>
    </div>

    <!-- ORDER DETAILS -->
    <template v-else-if="order">
      <div class="detail-header">
        <h2>Order #{{ formatOrderId(order._id) }}</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="printOrder">
            <i class="fas fa-print"></i>
            <span>Print</span>
          </button>
          <router-link :to="'/admin/orders/edit/' + order._id" class="btn btn-primary">
            <i class="fas fa-pencil-alt"></i>
            <span>Edit</span>
          </router-link>
        </div>
      </div>

      <div class="detail-layout">
        <!-- LEFT COLUMN -->
        <div class="detail-column-left">
          <!-- ORDER ITEMS -->
          <div class="card">
            <div class="card-header">
              <h4>Order Items ({{ items.length }})</h4>
            </div>
            <div class="card-body">
              <table class="detail-item-table">
                <thead>
                  <tr>
                    <th colspan="2">Product</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="item._id">
                    <td class="col-image">
                      <img 
                        :src="getProductImage(item.product_id)" 
                        :alt="item.product_id?.name || 'Product'"
                        @error="handleImageError"
                      />
                    </td>
                    <td class="col-info">
                      <span class="item-name">{{ item.product_id?.name || 'Unknown Product' }}</span>
                    </td>
                    <td class="col-qty">x {{ item.quantity }}</td>
                    <td class="col-price">{{ formatPrice(item.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- ORDER SUMMARY -->
          <div class="card">
            <div class="card-header">
              <h4>Order Summary</h4>
            </div>
            <div class="card-body">
              <div class="order-summary-detail">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>{{ formatPrice(calculateSubtotal) }}</span>
                </div>
                <div class="summary-row">
                  <span>Shipping:</span>
                  <span>{{ formatPrice(0) }}</span>
                </div>
                <div class="summary-row total">
                  <strong>Total:</strong>
                  <strong>{{ formatPrice(order.total_amount) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- RIGHT COLUMN -->
        <div class="detail-column-right">
          <!-- ORDER STATUS -->
          <div class="card">
            <div class="card-header">
              <h4>Order Status</h4>
            </div>
            <div class="card-body">
              <div class="status-group">
                <label>Payment Status:</label>
                <span 
                  class="status-badge" 
                  :class="getPaymentStatusClass(order.payment_status)"
                >
                  {{ formatStatus(order.payment_status) }}
                </span>
              </div>
              <div class="status-group">
                <label>Order Status:</label>
                <span 
                  class="status-badge" 
                  :class="getOrderStatusClass(order.order_status)"
                >
                  {{ formatStatus(order.order_status) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- CUSTOMER -->
          <div class="card">
            <div class="card-header">
              <h4>Customer</h4>
            </div>
            <div class="card-body">
              <div class="customer-info-row">
                <i class="fas fa-user"></i>
                <span>{{ order.recipient_name }}</span>
              </div>
              <div class="customer-info-row" v-if="order.recipient_email">
                <i class="fas fa-envelope"></i>
                <a :href="'mailto:' + order.recipient_email">{{ order.recipient_email }}</a>
              </div>
              <div class="customer-info-row">
                <i class="fas fa-phone"></i>
                <span>{{ order.recipient_phone }}</span>
              </div>
            </div>
          </div>
          
          <!-- SHIPPING ADDRESS -->
          <div class="card">
            <div class="card-header">
              <h4>Shipping Address</h4>
            </div>
            <div class="card-body">
              <address class="shipping-address">
                <strong>{{ order.recipient_name }}</strong><br>
                {{ order.shipping_address }}
              </address>
              <div v-if="order.shipping_note" class="shipping-note">
                <strong>Note:</strong> {{ order.shipping_note }}
              </div>
            </div>
          </div>

          <!-- ORDER INFO -->
          <div class="card">
            <div class="card-header">
              <h4>Order Information</h4>
            </div>
            <div class="card-body">
              <div class="customer-info-row">
                <i class="fas fa-calendar"></i>
                <span>{{ formatDate(order.order_date) }}</span>
              </div>
              <div class="customer-info-row">
                <i class="fas fa-credit-card"></i>
                <span>{{ formatPaymentMethod(order.payment_method) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()
import { useToast } from 'vue-toastification'
const toast = useToast()
import { formatDate, formatPrice, formatTime, buildImagePath } from '@/utilities/helper'

const route = useRoute()
const router = useRouter()

// State
const orderId = ref(route.params.id)
const loading = ref(true)
const error = ref(null)
const order = ref(null)
const items = ref([])
const defaultImage = ''

// Computed: Calculate subtotal
const calculateSubtotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.subtotal || 0), 0)
})

// Fetch order details
async function fetchOrderDetails() {
  loading.value = true
  error.value = null

  try {
    const token = await getToken.value()
    const response = await axios.get(`/api/admin/orders/${orderId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    })

    if (response.data.success) {
      order.value = response.data.order
      items.value = response.data.items
    } else {
      throw new Error(response.data.message || 'Failed to fetch order details')
    }

  } catch (err) {
    console.error('Error fetching order details:', err)
    
    if (err.response) {
      if (err.response.status === 404) {
        error.value = 'Order Not Found'
      } else if (err.response.status === 401) {
        error.value = 'Unauthorized'
        router.push('/admin/login')
      } else {
        error.value = err.response.data.message || 'Failed to load order'
      }
    } else if (err.request) {
      error.value = 'Network Error'
    } else {
      error.value = err.message || 'An error occurred'
    }
  } finally {
    loading.value = false
  }
}

// Print order
function printOrder() {
  window.print()
}

// Formatters
function formatOrderId(id) {
  if (!id) return 'N/A'
  return id.slice(-6).toUpperCase()
}

function formatStatus(status) {
  if (!status) return 'N/A'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatPaymentMethod(method) {
  if (!method) return 'N/A'
  return method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'
}

function getPaymentStatusClass(status) {
  const statusMap = {
    'pending': 'unpaid',
    'paid': 'paid',
    'refunded': 'cancelled',
    'failed': 'cancelled'
  }
  return statusMap[status] || ''
}

function getOrderStatusClass(status) {
  const statusMap = {
    'pending': 'unpaid',
    'confirmed': 'paid',
    'shipped': 'shipping',
    'delivered': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || ''
}

function getProductImage(product) {
  if (!product) return ''
  if (product.image_urls && product.image_urls.length > 0) {
    return buildImagePath(product.image_urls[0])
  }
  return ''
}

function handleImageError(event) {
  event.target.src = defaultImage
}

// Load order on mount
onMounted(() => {
  fetchOrderDetails()
})
</script>

<style scoped src="@/styling/OrderDetailView.css"></style>