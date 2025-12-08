<!--views/OrderList.vue-->
<template>
  <div class="order-form-page">
    <nav class="form-breadcrumbs">
      <router-link to="/admin/dashboard">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/admin/orders">Orders</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>Edit Order #{{ formatOrderId(orderId) }}</strong>
    </nav>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading order...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>{{ error }}</h2>
      <p>Couldn't load the order. Please try again.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
        <button @click="fetchOrderDetails" class="btn btn-secondary">Try Again</button>
        <router-link to="/admin/orders" class="btn btn-primary">Back to Orders</router-link>
      </div>
    </div>

    <form v-else-if="formData" @submit.prevent="handleSubmit" class="product-form-layout">
      
      <div class="form-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Customer Details</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Customer Name</label>
              <input 
                type="text" 
                v-model="formData.recipient_name"
                disabled
              />
            </div>
            <div class="form-row-grid-2">
              <div class="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  v-model="formData.recipient_email"
                  disabled
                />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input 
                  type="tel"
                  pattern="(\+84|0)\d{9,10}" 
                  v-model="formData.recipient_phone"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4>Shipping Address</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Address</label>
              <input 
                type="text" 
                v-model="formData.shipping_address"
                disabled
              />
            </div>
            <div class="form-group">
              <label>Shipping Note (Optional)</label>
              <input 
                type="text" 
                v-model="formData.shipping_note"
                placeholder="Add delivery instructions..."
                disabled
              />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4>Update Status</h4>
          </div>
          <div class="card-body">
            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="paymentStatus">Payment Status</label>
                <select id="paymentStatus" v-model="formData.payment_status">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div class="form-group">
                <label for="orderStatus">Order Status</label>
                <select id="orderStatus" v-model="formData.order_status">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Order Items</h4>
          </div>
          <div class="card-body">
            <div v-for="item in items" :key="item._id" class="order-item-stub">
              <img 
                :src="getProductImage(item.product_id)" 
                :alt="item.product_id?.name || 'Product'"
              />
              <span class="item-name">{{ item.product_id?.name || 'Unknown' }}</span>
              <span class="item-qty">x {{ item.quantity }}</span>
              <span class="item-price">{{ formatPrice(item.subtotal) }}</span>
            </div>
            <hr class="item-divider" />
            <div class="order-total-stub">
              <strong>Total:</strong>
              <strong>{{ formatPrice(orderTotal) }}</strong>
            </div>
            <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted);">
              <i class="fas fa-info-circle"></i>
              Order items and pricing cannot be modified
            </p>
          </div>
        </div>
        
        <!-- FORM ACTIONS (Back to previous pages (done), saving changes (done), cancel order (to be implemented)) -->
        <div class="form-action-buttons">
          <router-link to="/admin/orders" class="btn btn-secondary">
            Back
          </router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <i class="fas fa-save"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" @click="handleCancel" class="btn btn-cancel" :disabled="saving || !isCancellable">
            <i class="fas fa-save"></i>
            {{ saving ? 'Cancelling...' : 'Cancel Order' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
import { useToast } from 'vue-toastification'
import { formatPrice, buildImagePath } from '@/utilities/helper'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getToken } = useAuth()

// State
const orderId = ref(route.params.id)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const formData = ref(null)
const items = ref([])
const orderTotal = ref(0)
const defaultImage = ''
const isCancellable = ref(false)

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
      const order = response.data.order
      
      formData.value = {
        recipient_name: order.recipient_name,
        recipient_email: order.recipient_email || '',
        recipient_phone: order.recipient_phone,
        shipping_address: order.shipping_address,
        shipping_note: order.shipping_note || '',
        order_status: order.order_status,
        payment_status: order.payment_status
      }
      isCancellable.value = order.order_status !== "cancelled"

      items.value = response.data.items
      orderTotal.value = order.total_amount

    } else {
      throw new Error(response.data.message || 'Failed to fetch order')
    }

  } catch (err) {
    console.error('Error fetching order:', err)
    
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

// Handle order cancellation
async function handleCancel() {
  if (saving.value) 
    return
  saving.value = true
  try {
    const token = await getToken.value()
    const response = await axios.delete(`/api/admin/orders/${orderId.value}`,
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    )

    if (response.data.success) {
      toast.success('Order successfully cancelled!')
      router.push('/admin/orders')
    } else {
      throw new Error(response.data.message || 'Failed to cancel order')
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
    saving.value = false
  }
}

// Handle form submission
async function handleSubmit() {
  if (saving.value) 
    return
  saving.value = true

  try {
    const token = await getToken.value()
    const response = await axios.put(`/api/admin/orders/${orderId.value}`,
      formData.value,
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    )

    if (response.data.success) {
      toast.success('Order updated successfully!')
      router.push('/admin/orders')
    } else {
      throw new Error(response.data.message || 'Failed to update order')
    }

  } catch (err) {
    console.error('Error updating order:', err)
    let errorMessage = 'Failed to update order. Please try again.'
    
    if (err.response) {
      errorMessage = err.response.data.message || errorMessage
    } else if (err.request) {
      errorMessage = 'Network error. Please check your connection.'
    }
    
    toast.error(errorMessage)
  } finally {
    saving.value = false
  }
}

// Formatters
function formatOrderId(id) {
  if (!id) return ''
  return id.slice(-6).toUpperCase()
}

function getProductImage(product) {
  if (!product) return defaultImage
  
  if (product.image_urls && product.image_urls.length > 0) {
    return buildImagePath(product.image_urls[0])
  }
  
  return defaultImage
}

// Load order on mount
onMounted(() => {
  fetchOrderDetails()
})
</script>

<style src="@/styling/OrderForm.css"></style>