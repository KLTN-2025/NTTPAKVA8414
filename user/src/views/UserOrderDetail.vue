<!--src/views/UserOrderDetail.vue-->
<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="Order Details Banner" class="cart-banner-img" />
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <router-link to="/orders">My Orders</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>Order Details</strong>
      </nav>
    </div>
  </div>

  <div class="order-detail-container">
    
    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading order details...</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-state">
      <h1>{{ error }}</h1>
      <p>We couldn't load this order. Please try again.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
        <button @click="fetchOrderDetails" class="btn btn-retry">Try Again</button>
        <router-link to="/orders" class="btn btn-shop-now">Back to My Orders</router-link>
      </div>
    </div>

    <!-- ORDER DETAILS -->
    <template v-else-if="orderData">
      <div class="detail-page-header">
        <div class="header-left">
          <h1>Order #{{ formatOrderId(orderData._id) }}</h1>
          <span class="order-meta">{{ formatDate(orderData.order_date) }}</span>
          <span class="order-meta-separator">•</span>
          <span class="order-meta">{{ items.length }} Product{{ items.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="header-right">
          <router-link to="/orders" class="back-to-list-btn">
            <i class="fas fa-arrow-left"></i> Back to List
          </router-link>
        </div>
      </div>

      <!-- CANCELLED BANNER -->
      <div v-if="orderData.order_status === 'cancelled'" class="cancelled-banner">
        <i class="fas fa-times-circle"></i>
        <span>This order has been cancelled on {{ formatDate(orderData.updatedAt) }}</span>
      </div>

      <!-- STATUS TIMELINE -->
      <div v-else class="status-timeline">
        <div class="step" :class="{ 'completed': orderStep >= 1, 'active': orderStep === 1 }">
          <div class="step-icon">
            <i v-if="orderStep > 1" class="fas fa-check"></i>
            <span v-else>01</span>
          </div>
          <span>Order received</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 2, 'active': orderStep === 2 }">
          <div class="step-icon">
            <i v-if="orderStep > 2" class="fas fa-check"></i>
            <span v-else>02</span>
          </div>
          <span>Processing</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 3, 'active': orderStep === 3 }">
          <div class="step-icon">
            <i v-if="orderStep > 3" class="fas fa-check"></i>
            <span v-else>03</span>
          </div>
          <span>Shipping</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 4, 'active': orderStep === 4 }">
          <div class="step-icon">
            <i v-if="orderStep >= 4" class="fas fa-check"></i>
            <span v-else>04</span>
          </div>
          <span>Delivered</span>
        </div>
        <div class="timeline-bar">
          <div class="timeline-progress" :style="{ width: progressPercentage }"></div>
        </div>
      </div>

      <!-- INFO GRID -->
      <div class="info-grid">
        <!-- BILLING INFO (Name, Email, Phone only) -->
        <div class="info-card">
          <h4>Billing Information</h4>
          <div class="billing-info">
            <div class="info-row">
              <i class="fas fa-user"></i>
              <span>{{ orderData.recipient_name }}</span>
            </div>
            <div class="info-row" v-if="orderData.recipient_email">
              <i class="fas fa-envelope"></i>
              <span>{{ orderData.recipient_email }}</span>
            </div>
            <div class="info-row">
              <i class="fas fa-phone"></i>
              <span>{{ orderData.recipient_phone }}</span>
            </div>
          </div>
        </div>

        <!-- SHIPPING ADDRESS -->
        <div class="info-card">
          <h4>Shipping Address</h4>
          <address>
            <strong>{{ orderData.recipient_name }}</strong><br>
            {{ orderData.shipping_address }}<br>
            <div class="info-contact">
              <span v-if="orderData.recipient_email">
                <i class="fas fa-envelope"></i> {{ orderData.recipient_email }}
              </span>
              <span>
                <i class="fas fa-phone"></i> {{ orderData.recipient_phone }}
              </span>
            </div>
          </address>
          <div v-if="orderData.shipping_note" class="shipping-note">
            <strong>Note:</strong> {{ orderData.shipping_note }}
          </div>
        </div>

        <!-- ORDER SUMMARY -->
        <div class="info-card summary-card">
          <h4>Order Summary</h4>
          <div class="summary-row">
            <span>Order ID:</span>
            <strong>#{{ formatOrderId(orderData._id) }}</strong>
          </div>
          <div class="summary-row">
            <span>Payment Method:</span>
            <strong>{{ formatPaymentMethod(orderData.payment_method) }}</strong>
          </div>
          <div class="summary-row">
            <span>Payment Status:</span>
            <span class="status-badge" :class="getPaymentStatusClass(orderData.payment_status)">
              {{ formatStatus(orderData.payment_status) }}
            </span>
          </div>
          <div class="summary-row">
            <span>Order Status:</span>
            <span class="status-badge" :class="getOrderStatusClass(orderData.order_status)">
              {{ formatStatus(orderData.order_status) }}
            </span>
          </div>
          <hr />
          <div class="summary-row total">
            <span>Total Amount</span>
            <strong>{{ formatPrice(orderData.total_amount) }}</strong>
          </div>

          <!-- CANCEL ORDER BUTTON -->
          <div v-if="canCancelOrder" class="cancel-button-container">
            <button 
              @click="showCancelDialog = true" 
              class="btn btn-cancel"
              :disabled="cancelling"
            >
              <i class="fas fa-times-circle"></i>
              {{ cancelling ? 'Cancelling...' : 'Cancel Order' }}
            </button>
          </div>
        </div>
      </div>

      <!-- PRODUCT LIST TABLE -->
      <div class="table-container">
        <table class="order-item-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item._id">
              <td>
                <div class="product-cell">
                  <img 
                    :src="getProductImage(item.product_id)" 
                    :alt="item.product_id?.name || 'Product'"
                    @error="handleImageError"
                  />
                  <div class="product-info">
                    <span class="item-name">{{ item.product_id?.name || 'Unknown Product' }}</span>
                    <span class="item-sku" v-if="item.product_id?.SKU">SKU: {{ item.product_id.SKU }}</span>
                  </div>
                </div>
              </td>
              <td data-label="Price">{{ formatPrice(item.price) }}</td>
              <td data-label="Quantity">x{{ item.quantity }}</td>
              <td data-label="Subtotal">{{ formatPrice(item.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- CANCEL ORDER CONFIRMATION DIALOG -->
    <div v-if="showCancelDialog" class="dialog-overlay" @click.self="showCancelDialog = false">
      <div class="dialog-box">
        <div class="dialog-header">
          <h3>Cancel Order</h3>
          <button @click="showCancelDialog = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <p>Are you sure you want to cancel this order?</p>
          <p class="warning-text">
            <i class="fas fa-exclamation-triangle"></i>
            This action cannot be undone.
          </p>
        </div>
        <div class="dialog-footer">
          <button @click="showCancelDialog = false" class="btn btn-secondary">
            No, Keep Order
          </button>
          <button @click="cancelOrder" class="btn btn-cancel" :disabled="cancelling">
            {{ cancelling ? 'Cancelling...' : 'Yes, Cancel Order' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { isSignedIn, getToken } = useAuth()

import '@fortawesome/fontawesome-free/css/all.min.css'
import { useToast } from 'vue-toastification'
const toast = useToast()

import { formatDate, formatPrice, buildImagePath } from '@/utilities/helper'

const route = useRoute()
const router = useRouter()
const isLoggedIn = computed(() => isSignedIn.value)

// State
const orderId = ref(route.params.id)
const loading = ref(true)
const error = ref(null)
const orderData = ref(null)
const items = ref([])
const showCancelDialog = ref(false)
const cancelling = ref(false)
const defaultImage = 'https://via.placeholder.com/60/cccccc/666666?text=No+Image'

// Computed: Map order status to timeline step
const orderStep = computed(() => {
  if (!orderData.value) return 0
  
  switch (orderData.value.order_status) {
    case 'pending':
      return 1
    case 'confirmed':
      return 2
    case 'shipped':
      return 3
    case 'delivered':
      return 4
    case 'cancelled':
      return 0
    default:
      return 1
  }
})

// Computed: Calculate timeline progress percentage
const progressPercentage = computed(() => {
  if (orderStep.value <= 1) return '0%'
  if (orderStep.value === 2) return '33.33%'
  if (orderStep.value === 3) return '66.66%'
  if (orderStep.value >= 4) return '100%'
  return '0%'
})

// Computed: Check if order can be cancelled
const canCancelOrder = computed(() => {
  if (!orderData.value) return false
  return ['pending', 'confirmed'].includes(orderData.value.order_status)
})

// Fetch order details from API
async function fetchOrderDetails() {
  if (!isLoggedIn)
    return
  loading.value = true
  error.value = null


  try {
    const token = await getToken.value()
    const response = await axios.get(`/api/orders/${orderId.value}`, {
      withCredentials: true,
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    })

    const data = response.data

    if (data.success) {
      orderData.value = data.order || {}
      items.value = data.items || []
    } else {
      throw new Error(data.message || 'Failed to fetch order details')
    }

  } catch (err) {
    console.error('Error fetching order details:', err)
    
    if (err.response) {
      if (err.response.status === 404) {
        error.value = 'Order Not Found'
      } else if (err.response.status === 401) {
        error.value = 'Unauthorized'
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

// Cancel order
async function cancelOrder() {
  if (cancelling.value || !isSignedIn) 
    return
  
  cancelling.value = true

  try {
    const token = await getToken.value()
    const response = await axios.put(`/api/orders/${orderId.value}/cancel`, {
      withCredentials: true,
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    })

    const data = response.data

    if (data.success) {
      orderData.value.order_status = 'cancelled'
      orderData.value.payment_status = data.order.payment_status
      
      showCancelDialog.value = false
      
    toast.success('Successfully cancel this order!')
    } else {
      throw new Error(data.message || 'Failed to cancel order')
    }

  } catch (err) {
    let errorMessage = 'Failed to cancel order. Please try again.'
    
    if (err.response) {
      errorMessage = err.response.data.message || errorMessage
    } else if (err.request) {
      errorMessage = 'Network error. Please check your connection.'
    }
    
    toast.error(errorMessage)
  } finally {
    cancelling.value = false
  }
}

// Format order ID (last 6 characters)
function formatOrderId(id) {
  if (!id) return 'N/A'
  return id.slice(-6).toUpperCase()
}

// Format status (capitalize)
function formatStatus(status) {
  if (!status) return 'N/A'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Format payment method
function formatPaymentMethod(method) {
  if (!method) return 'N/A'
  return method === 'cod' ? 'COD' : 'Bank Transfer'
}

// Get order status badge class
function getOrderStatusClass(status) {
  const statusMap = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'shipped': 'shipping',
    'delivered': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || ''
}

// Get payment status badge class
function getPaymentStatusClass(status) {
  const statusMap = {
    'pending': 'unpaid',
    'paid': 'paid',
    'refunded': 'cancelled',
    'failed': 'cancelled'
  }
  return statusMap[status] || ''
}

// Get product image URL
function getProductImage(product) {
  if (!product) return defaultImage
  
  if (product.image_urls && product.image_urls.length > 0) {
    return buildImagePath(product.image_urls[0])
  }
  
  return defaultImage
}

// Handle image load errors
function handleImageError(event) {
  event.target.src = defaultImage
}

// Load order on mount
onMounted(() => {
  fetchOrderDetails()
})
</script>

<style scoped src="./UserOrderDetail.css"></style>