<template>
  <div class="supply-order-details-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-link">
          <i class="fas fa-arrow-left"></i>
          Back
        </button>
      </div>
      <div class="header-right">
        <span :class="['status-badge', `status-${order?.status?.toLowerCase()}`]">
          {{ isReceivingMode ? 'Receiving...' : order?.status }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="page-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading order details...</span>
    </div>

    <!-- Order Content -->
    <template v-else-if="order">
      <!-- Order Info Card -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Supplier</span>
            <span class="info-value">{{ order.supplier_id?.name || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Expected Arrival</span>
            <span class="info-value">{{ formatDate(order.expected_arrival) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Created</span>
            <span class="info-value">{{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="info-item" v-if="order.ordered_at">
            <span class="info-label">Ordered Date</span>
            <span class="info-value">{{ formatDate(order.ordered_at) }}</span>
          </div>
          <div class="info-item" v-if="order.received_at">
            <span class="info-label">Received Date</span>
            <span class="info-value">{{ formatDate(order.received_at) }}</span>
          </div>
          <div class="info-item" v-if="order.cancelled_at">
            <span class="info-label">Cancelled Date</span>
            <span class="info-value">{{ formatDate(order.cancelled_at) }}</span>
          </div>
        </div>
        <div v-if="order.notes" class="info-notes">
          <span class="info-label">Notes</span>
          <p>{{ order.notes }}</p>
        </div>
      </div>

      <!-- Receiving Mode Notice -->
      <div v-if="isReceivingMode" class="receiving-notice">
        <i class="fas fa-info-circle"></i>
        <span>Enter the quantity received for each item, then confirm receipt.</span>
      </div>

      <!-- Items Table -->
      <div class="items-section">
        <h2>Order Items</h2>
        
        <div class="items-table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th style="font-size: 14px; font-weight: 500;" >Product</th>
                <th style="font-size: 14px; font-weight: 500;" >SKU</th>
                <th style="font-size: 14px; font-weight: 500;"  class="col-number">Ordered</th>
                <th v-if="isReceivingMode || order.status === 'Received'" class="col-number">
                  Received
                </th>
                <th style="font-size: 14px; font-weight: 500;"  class="col-number">Unit Cost</th>
                <th style="font-size: 14px; font-weight: 500;"  class="col-number">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in order.items" :key="item._id || index">
                <td>
                  <span class="product-name">{{ item.product_id?.name || 'Unknown' }}</span>
                </td>
                <td>
                  <span class="product-sku">{{ item.product_id?.SKU || 'N/A' }}</span>
                </td>
                <td class="col-number">
                  <span class="quantity">{{ item.quantity_ordered }}</span>
                </td>
                <td v-if="isReceivingMode" class="col-number">
                  <input 
                    type="number"
                    v-model.number="receivedItems[index].quantity_received"
                    :max="item.quantity_ordered"
                    min="0"
                    class="input-received"
                  />
                </td>
                <td v-else-if="order.status === 'Received'" class="col-number">
                  <span 
                    class="quantity-received"
                    :class="{ 'partial': item.quantity_received < item.quantity_ordered }"
                  >
                    {{ item.quantity_received }}
                    <i v-if="item.quantity_received < item.quantity_ordered" class="fas fa-exclamation-triangle"></i>
                    <i v-else class="fas fa-check"></i>
                  </span>
                </td>
                <td class="col-number">
                  <span class="unit-cost">{{ formatPrice(item.unit_cost) }}</span>
                </td>
                <td class="col-number">
                  <span class="subtotal">
                    {{ formatPrice(getSubtotal(item, index)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="order-totals">
          <div class="total-row">
            <span class="total-label">Total Ordered:</span>
            <span class="total-value">{{ formatPrice(order.total_cost_ordered) }}</span>
          </div>
          <div v-if="isReceivingMode" class="total-row highlight">
            <span class="total-label">Total Received:</span>
            <span class="total-value">{{ formatPrice(calculatedReceivedTotal) }}</span>
          </div>
          <div v-else-if="order.status === 'Received'" class="total-row">
            <span class="total-label">Total Received:</span>
            <span class="total-value" :class="{ 'partial': order.total_cost_received < order.total_cost_ordered }">
              {{ formatPrice(order.total_cost_received) }}
            </span>
          </div>
        </div>

        <!-- Partial Delivery Warning -->
        <div v-if="isReceivingMode && hasPartialDelivery" class="partial-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>
            Some items were not fully received. This order will be marked as complete.
            Create a new order for remaining items if needed.
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="page-actions">
        <template v-if="isReceivingMode">
          <button class="btn btn-secondary" @click="cancelReceiving">
            Cancel
          </button>
          <button 
            class="btn btn-success" 
            @click="confirmReceive"
            :disabled="!canConfirmReceive || submitting"
          >
            <i class="fas fa-check"></i>
            <span v-if="submitting">Processing...</span>
            <span v-else>Confirm Receipt</span>
          </button>
        </template>

        <template v-else-if="order.status === 'Draft'">
          <router-link 
            :to="{ name: 'admin-supply-order-edit', params: { id: orderId } }"
            class="btn btn-secondary"
          >
            <i class="fas fa-edit"></i>
            Edit Order
          </router-link>
          <button class="btn btn-primary" @click="openStatusModal('Ordered')">
            <i class="fas fa-arrow-right"></i>
            Mark as Ordered
          </button>
          <button class="btn btn-danger-outline" @click="openCancelModal">
            <i class="fas fa-times"></i>
            Cancel Order
          </button>
        </template>

        <template v-else-if="order.status === 'Ordered'">
          <button class="btn btn-success" @click="startReceiving">
            <i class="fas fa-check"></i>
            Mark as Received
          </button>
          <button class="btn btn-danger-outline" @click="openCancelModal">
            <i class="fas fa-times"></i>
            Cancel Order
          </button>
        </template>

        <template v-else>
          <!-- Received or Cancelled - no actions -->
          <span class="status-message">
            <template v-if="order.status === 'Received'">
              <i class="fas fa-check-circle"></i>
              Stock has been updated automatically.
            </template>
            <template v-else>
              <i class="fas fa-ban"></i>
              This order has been cancelled.
            </template>
          </span>
        </template>
      </div>
    </template>

    <!-- Status Change Modal (Draft → Ordered) -->
    <ConfirmationModal
      v-if="isStatusModalVisible"
      title="Submit Order"
      :message="`Are you sure you want to change order status to <strong>Ordered</strong>? The order items will be locked for editing.`"
      confirm-text="Confirm"
      type="info"
      :loading="submitting"
      @close="closeStatusModal"
      @confirm="confirmStatusChange"
    />

    <!-- Cancel Order Modal -->
    <ConfirmationModal
      v-if="isCancelModalVisible"
      title="Cancel Order"
      :message="`Are you sure you want to cancel this order? This action cannot be undone.`"
      confirm-text="Cancel Order"
      type="danger"
      :loading="submitting"
      @close="closeCancelModal"
      @confirm="confirmCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuth } from '@clerk/vue'
import axios from 'axios'
import { formatPrice, formatDate } from '@/utilities/helper'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getToken } = useAuth()

const orderId = computed(() => route.params.id)

// Data
const order = ref(null)
const loading = ref(false)
const submitting = ref(false)

// Receiving mode
const isReceivingMode = ref(false)
const receivedItems = ref([])

// Modals
const isStatusModalVisible = ref(false)
const isCancelModalVisible = ref(false)

// Calculate received total in receiving mode
const calculatedReceivedTotal = computed(() => {
  if (!isReceivingMode.value) return 0
  return receivedItems.value.reduce((sum, item, index) => {
    return sum + (item.quantity_received * order.value.items[index].unit_cost)
  }, 0)
})

// Check if at least one item has quantity > 0
const canConfirmReceive = computed(() => {
  return receivedItems.value.some(item => item.quantity_received > 0)
})

// Check if any item is partially received
const hasPartialDelivery = computed(() => {
  if (!isReceivingMode.value) return false
  return receivedItems.value.some((item, index) => {
    return item.quantity_received < order.value.items[index].quantity_ordered
  })
})

// Get subtotal for an item
function getSubtotal(item, index) {
  if (isReceivingMode.value) {
    return receivedItems.value[index].quantity_received * item.unit_cost
  }
  if (order.value.status === 'Received') {
    return item.quantity_received * item.unit_cost
  }
  return item.quantity_ordered * item.unit_cost
}

// Fetch order details
async function fetchOrder() {
  loading.value = true
  try {
    const token = await getToken.value()
    const response = await axios.get(`/api/admin/supply-orders/${orderId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data?.success) {
      order.value = response.data.data
      
      if (route.query.receive === 'true' && order.value.status === 'Ordered') {
        startReceiving()
      }
    }
  } catch (err) {
    console.error('Failed to fetch order:', err)
    toast.error('Failed to load order details')
    router.push({ name: 'admin-suppliers' })
  } finally {
    loading.value = false
  }
}

function startReceiving() {
  if (order.value.status !== 'Ordered') return
  
  receivedItems.value = order.value.items.map(item => ({
    product_id: item.product_id?._id || item.product_id,
    quantity_received: item.quantity_ordered
  }))
  
  isReceivingMode.value = true
}

function cancelReceiving() {
  isReceivingMode.value = false
  receivedItems.value = []
  
  // Remove query param
  if (route.query.receive) {
    router.replace({ query: {} })
  }
}

async function confirmReceive() {
  if (!canConfirmReceive.value) return
  
  submitting.value = true
  try {
    const token = await getToken.value()
    const response = await axios.patch(`/api/admin/supply-orders/${orderId.value}/status`, {
      status: 'Received',
      receivedItems: receivedItems.value
    }, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data?.success) {
      toast.success('Order marked as received. Stock updated.')
      isReceivingMode.value = false
      receivedItems.value = []
      
      // Refresh order data
      await fetchOrder()
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to update order'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

// Status change modal (Draft → Ordered)
function openStatusModal(newStatus) {
  isStatusModalVisible.value = true
}

function closeStatusModal() {
  isStatusModalVisible.value = false
}

async function confirmStatusChange() {
  submitting.value = true
  try {
    const token = await getToken.value()
    const response = await axios.patch(`/api/admin/supply-orders/${orderId.value}/status`, {
      status: 'Ordered'
    }, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data?.success) {
      toast.success('Order status changed to Ordered')
      closeStatusModal()
      await fetchOrder()
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to update order status'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

// Cancel modal
function openCancelModal() {
  isCancelModalVisible.value = true
}

function closeCancelModal() {
  isCancelModalVisible.value = false
}

async function confirmCancel() {
  submitting.value = true
  try {
    const token = await getToken.value()
    const response = await axios.patch(`/api/admin/supply-orders/${orderId.value}/status`, {
      status: 'Cancelled'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data?.success) {
      toast.success('Order cancelled successfully')
      closeCancelModal()
      await fetchOrder()
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to cancel order'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

// Navigation
function goBack() {
  router.back()
}

onMounted(() => {
  fetchOrder()
})

watch(orderId, () => {
  fetchOrder()
})
</script>

<style src="@/styling/SupplierOrderDetails.css"></style>