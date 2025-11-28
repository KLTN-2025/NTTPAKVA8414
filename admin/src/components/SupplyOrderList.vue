<template>
  <div class="inline-orders-container">
    <div class="inline-orders-header">
      <button 
        @click="navigateToNewOrder" 
        class="btn btn-sm btn-primary"
      >
        <i class="fas fa-plus"></i>
        <span>New Order</span>
      </button>
      
      <router-link 
        v-if="pagination.totalItems > 0"
        :to="{ name: 'admin-supplier-orders', params: { supplierId: supplierId } }"
        class="view-all-link"
      >
        View All <i class="fas fa-arrow-right"></i>
      </router-link>
    </div>

    <div v-if="loading" class="inline-orders-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading orders...</span>
    </div>

    <div v-else-if="orders.length === 0" class="inline-orders-empty">
      <i class="fas fa-clipboard-list"></i>
      <span>No supply orders yet</span>
    </div>

    <div v-else class="inline-orders-list">
      <div 
        v-for="order in orders" 
        :key="order._id" 
        class="inline-order-item"
      >
        <div class="order-info">
          <span class="order-id">#{{ order._id.slice(-6).toUpperCase() }}</span>
          <span :class="['order-status', `status-${order.status.toLowerCase()}`]">
            {{ order.status }}
          </span>
        </div>
        
        <div class="order-details">
          <span class="order-cost">{{ formatPrice(order.total_cost_ordered) }}</span>
          <span class="order-date">
            <template v-if="order.status === 'Draft'">
              Created: {{ formatDate(order.createdAt) }}
            </template>
            <template v-else-if="order.status === 'Ordered'">
              ETA: {{ formatDate(order.expected_arrival) }}
            </template>
            <template v-else-if="order.status === 'Received'">
              Received: {{ formatDate(order.received_at) }}
            </template>
            <template v-else>
              Cancelled: {{ formatDate(order.cancelled_at) }}
            </template>
          </span>
        </div>

        <div class="order-actions">
          <template v-if="order.status === 'Draft'">
            <router-link 
              :to="{ name: 'admin-supply-order-edit', params: { id: order._id } }"
              class="action-btn btn-edit"
            >
              <i class="fas fa-edit"></i>
              Edit
            </router-link>
            <button 
              @click="$emit('change-status', order, 'Ordered')" 
              class="action-btn btn-status"
            >
              <i class="fas fa-arrow-right"></i>
              Order
            </button>
          </template>

          <template v-else-if="order.status === 'Ordered'">
            <router-link 
              :to="{ name: 'admin-supply-order-view', params: { id: order._id } }"
              class="action-btn btn-view"
            >
              <i class="fas fa-eye"></i>
              View
            </router-link>
            <button 
              @click="$emit('receive-order', order)" 
              class="action-btn btn-receive"
            >
              <i class="fas fa-check"></i>
              Receive
            </button>
          </template>

          <template v-else>
            <router-link 
              :to="{ name: 'admin-supply-order-view', params: { id: order._id } }"
              class="action-btn btn-view"
            >
              <i class="fas fa-eye"></i>
              View
            </router-link>
          </template>
        </div>
      </div>

      <div v-if="pagination.totalItems > orders.length" class="inline-orders-footer">
        Showing {{ orders.length }} of {{ pagination.totalItems }} orders
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
import { formatPrice, formatDate } from '@/utilities/helper'

const { getToken } = useAuth()

const props = defineProps({
  supplierId: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    default: ''
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change-status', 'receive-order'])

const router = useRouter()

const orders = ref([])
const loading = ref(false)
const loaded = ref(false)
const pagination = reactive({
  totalItems: 0,
  totalPages: 0
})

async function fetchOrders() {
  if (loaded.value) return
  
  loading.value = true
  try {
    const token = await getToken.value()
    const response = await axios.get(`/api/admin/suppliers/${props.supplierId}/supply-orders`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: { limit: 5 }
    })

    if (response.data?.success) {
      orders.value = response.data.data
      pagination.totalItems = response.data.pagination.totalItems
      pagination.totalPages = response.data.pagination.totalPages
      loaded.value = true
    }
  } catch (err) {
    console.error('Failed to fetch supplier orders:', err)
  } finally {
    loading.value = false
  }
}

function navigateToNewOrder() {
  router.push({
    name: 'admin-supply-order-new',
    query: { supplierId: props.supplierId }
  })
}

// Refresh orders (called by parent after status change)
function refresh() {
  loaded.value = false
  fetchOrders()
}

// Lazy load when expanded
watch(() => props.isExpanded, (expanded) => {
  if (expanded && !loaded.value) {
    fetchOrders()
  }
}, { immediate: true })

defineExpose({ refresh })
</script>

<style scoped>
.inline-orders-container {
  padding: 1rem 1.5rem;
  background-color: var(--admin-bg, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.inline-orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
}

.btn-primary {
  background-color: var(--primary-color, #4F46E5);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary-color, #4F46E5);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.view-all-link:hover {
  opacity: 0.8;
}

.inline-orders-loading,
.inline-orders-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-light, #9ca3af);
  font-size: 0.875rem;
}

.inline-orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inline-order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: var(--sidebar-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.inline-order-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.order-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 140px;
}

.order-id {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dark, #111827);
}

.order-status {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-ordered {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-received {
  background-color: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.order-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.order-cost {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark, #111827);
}

.order-date {
  font-size: 0.75rem;
  color: var(--text-light, #9ca3af);
}

.order-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 5px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-btn i {
  font-size: 0.7rem;
}

.btn-edit {
  color: var(--primary-color, #4F46E5);
  border-color: var(--primary-color, #4F46E5);
}

.btn-edit:hover {
  background-color: var(--primary-color-light, rgba(79, 70, 229, 0.1));
}

.btn-view {
  color: var(--text-muted, #6b7280);
}

.btn-view:hover {
  background-color: var(--admin-bg, #f9fafb);
}

.btn-status {
  color: #2563eb;
  border-color: #2563eb;
}

.btn-status:hover {
  background-color: #eff6ff;
}

.btn-receive {
  color: #16a34a;
  border-color: #16a34a;
}

.btn-receive:hover {
  background-color: #f0fdf4;
}

.inline-orders-footer {
  text-align: center;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-light, #9ca3af);
}
</style>