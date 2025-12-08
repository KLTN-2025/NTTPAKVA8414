<!--views/OrderList.vue-->
<template>
  <div class="order-list-page">
    
    <!-- HEADER WITH SEARCH AND ACTIONS -->
    <div class="list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Search by Order ID, Customer name..." 
          v-model="searchQuery"
          @input="debounceSearch"
        />
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportOrders" :disabled="exporting">
          <i class="fas fa-file-export"></i>
          <span>{{ exporting ? 'Exporting...' : 'Export' }}</span>
        </button>
      </div>
    </div>

    <!-- STATUS TABS -->
    <nav class="status-tabs">
      <button 
        v-for="tab in statusTabs" 
        :key="tab.value"
        :class="['tab-btn', { 'active': activeTab === tab.value }]"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading orders...</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchOrders" class="btn btn-secondary">Try Again</button>
    </div>

    <!-- ORDERS TABLE -->
    <div v-else class="table-container">
      <table class="order-table">
        <thead>
          <tr>
            <th @click="handleSort('_id')" class="sortable">
              Orders <i :class="getSortIcon('_id')"></i>
            </th>
            <th @click="handleSort('recipient_name')" class="sortable">
              Customer <i :class="getSortIcon('recipient_name')"></i>
            </th>
            <th @click="handleSort('total_amount')" class="sortable">
              Total <i :class="getSortIcon('total_amount')"></i>
            </th>
            <th @click="handleSort('order_date')" class="sortable">
              Date <i :class="getSortIcon('order_date')"></i>
            </th>
            <th>Payment</th>
            <th>Status</th>
            <th class="action-header">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order._id">
            <td>
              <div class="product-cell">
                <img 
                  :src="buildImagePath(order.previewProduct.image)" 
                  :alt="order.previewProduct?.name || 'Order'"
                />
                <div class="product-info">
                  <p style="text-align: left;" class="order-id">#{{ formatOrderId(order._id) }}</p>
                  <span style="text-align: left;" class="product-name">
                    {{ order.previewProduct?.name || 'Order' }}
                    <span v-if="order.itemCount > 1">({{ order.itemCount }} items)</span>
                  </span>
                </div>
              </div>
            </td>
            <td>{{ order.recipient_name }}</td>
            <td>{{ formatPrice(order.total_amount) }}</td>
            <td>
              <div class="date-cell">
                <span>{{ formatDate(order.order_date) }}</span>
                <span>{{ formatTime(order.order_date) }}</span>
              </div>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="getPaymentStatusClass(order.payment_status)"
              >
                {{ formatStatus(order.payment_status) }}
              </span>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="getOrderStatusClass(order.order_status)"
              >
                {{ formatStatus(order.order_status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <router-link :to="'/admin/orders/view/' + order._id" class="action-btn">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link :to="'/admin/orders/edit/' + order._id" class="action-btn">
                  <i class="fas fa-pencil-alt"></i>
                </router-link>
                <button 
                  class="action-btn btn-delete"
                  @click="openDeleteModal(order._id, order.recipient_name)"
                  :disabled="!canDelete(order.order_status)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="orders.length === 0">
            <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              No orders found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div v-if="!loading && !error && pagination.totalPages > 0" class="pagination-footer">
      <span>
        {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} - 
        {{ Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems) }} 
        of {{ pagination.totalItems }} Orders
      </span>
      <div class="page-controls">
        <span>The page on</span>
        <select v-model="pagination.currentPage" @change="fetchOrders">
          <option v-for="page in pagination.totalPages" :key="page" :value="page">
            {{ page }}
          </option>
        </select>
        <button 
          @click="goToPage(pagination.currentPage - 1)"
          :disabled="!pagination.hasPrevPage"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button 
          @click="goToPage(pagination.currentPage + 1)"
          :disabled="!pagination.hasNextPage"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- DELETE CONFIRMATION MODAL -->
    <div v-if="isDeleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>Delete Order</h3>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete order
            <strong>#{{ formatOrderId(orderToDelete.id) }} (Customer: {{ orderToDelete.name }})</strong>?
          </p>
          <p style="margin-top: 1rem; color: var(--text-light);">
            This will restore product stock and set the order status to cancelled.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- FILTER PANEL -->
    <Teleport to="body">
      <div 
        class="filter-panel-overlay" 
        :class="{ 'open': isFilterVisible }"
        @click.self="isFilterVisible = false"
      >
        <div class="filter-panel">
          <div class="filter-header">
            <h4>Filter Orders</h4>
            <button @click="isFilterVisible = false" class="close-btn">&times;</button>
          </div>
          <div class="filter-body">
            <div class="filter-group">
              <label>Payment Status</label>
              <select v-model="filters.payment_status">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Order Status</label>
              <select v-model="filters.order_status">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Order Date</label>
              <div class="date-inputs">
                <input type="date" v-model="filters.dateBegin" />
                <span>-</span>
                <input type="date" v-model="filters.dateEnd" />
              </div>
            </div>
            <div class="filter-group">
              <label>Price Range</label>
              <div class="price-inputs">
                <input 
                  type="number" 
                  v-model="filters.priceMin" 
                  placeholder="Min"
                />
                <span>-</span>
                <input 
                  type="number" 
                  v-model="filters.priceMax" 
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div class="filter-footer">
            <button class="btn btn-secondary" @click="clearFilters">Clear</button>
            <button class="btn btn-primary" @click="applyFilters">Apply Filters</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()
import { useToast } from 'vue-toastification'
import { formatDate, formatPrice, formatTime, buildImagePath } from '@/utilities/helper'
const toast = useToast()
const router = useRouter()

// State
const orders = ref([])
const loading = ref(false)
const error = ref(null)
const exporting = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const activeTab = ref('all')

// Filters
const filters = reactive({
  order_status: '',
  payment_status: '',
  dateBegin: '',
  dateEnd: '',
  priceMin: '',
  priceMax: ''
})

// Sorting
const sortBy = ref('order_date')
const sortOrder = ref('desc')

// Pagination
const pagination = reactive({
  currentPage: 1,
  perPage: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
})

// Status tabs
const statusTabs = ref([
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipping', value: 'shipped' },
  { label: 'Completed', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
])

// Delete modal
const isDeleteModalVisible = ref(false)
const orderToDelete = reactive({ id: null, name: '' })

// Filter panel
const isFilterVisible = ref(false)


// Debounce timer
let searchTimeout = null

// Fetch orders from API
async function fetchOrders() {
  loading.value = true
  error.value = null

  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.perPage,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }

    // Add search
    if (searchQuery.value) params.search = searchQuery.value

    // Add filters
    if (activeTab.value !== 'all') {
      params.order_status = activeTab.value
    } else if (filters.order_status) {
      params.order_status = filters.order_status
    }
    
    if (filters.payment_status) params.payment_status = filters.payment_status
    if (filters.dateBegin) params.dateBegin = filters.dateBegin
    if (filters.dateEnd) params.dateEnd = filters.dateEnd
    if (filters.priceMin) params.priceMin = filters.priceMin
    if (filters.priceMax) params.priceMax = filters.priceMax

    const token = await getToken.value() 
    const response = await axios.get('/api/admin/orders', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: params,
      withCredentials: true
    })

    if (response.data.success) {
      orders.value = response.data.data
      Object.assign(pagination, response.data.pagination)
    
    } else {
      throw new Error(response.data.message || 'Failed to fetch orders')
    }

  } catch (err) {
    toast.error('Error fetching orders:')
    if (err.response) {
      error.value = err.response.data.message || 'Failed to load orders'
    } else if (err.request) {
      error.value = 'Network error. Please check your connection.'
    } else {
      error.value = err.message || 'Failed to load orders'
    }
  } finally {
    loading.value = false
  }
}


// Debounce search
function debounceSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.currentPage = 1
    fetchOrders()
  }, 500)
}

// Change tab
function changeTab(tab) {
  activeTab.value = tab
  pagination.currentPage = 1
  fetchOrders()
}

// Sorting
function getSortIcon(field) {
  if (sortBy.value !== field) return 'fas fa-sort'
  return sortOrder.value === 'asc' ? 'fas fa-sort-up active-sort' : 'fas fa-sort-down active-sort'
}

function handleSort(field) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  fetchOrders()
}

// Pagination
function goToPage(page) {
  if (page < 1 || page > pagination.totalPages) return
  pagination.currentPage = page
  fetchOrders()
}

// Filters
function applyFilters() {
  pagination.currentPage = 1
  isFilterVisible.value = false
  fetchOrders()
}

function clearFilters() {
  filters.order_status = ''
  filters.payment_status = ''
  filters.dateBegin = ''
  filters.dateEnd = ''
  filters.priceMin = ''
  filters.priceMax = ''
  applyFilters()
}

// Delete order
function canDelete(status) {
  return ['pending', 'confirmed'].includes(status)
}

function openDeleteModal(id, name) {
  orderToDelete.id = id
  orderToDelete.name = name
  isDeleteModalVisible.value = true
}

function closeDeleteModal() {
  isDeleteModalVisible.value = false
  orderToDelete.id = null
  orderToDelete.name = ''
}

async function confirmDelete() {
  if (deleting.value || !orderToDelete.id) return
  
  deleting.value = true

  try {
    const token = await getToken.value()
    const response = await axios.delete(`/api/admin/orders/${orderToDelete.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    })

    if (response.data.success) {
      await fetchOrders()
      closeDeleteModal()
      toast.success('Order deleted successfully')
    } else {
      throw new Error(response.data.message || 'Failed to delete order')
    }

  } catch (err) {
    console.error('Error deleting order:', err)
    alert(err.response?.data?.message || 'Failed to delete order')
  } finally {
    deleting.value = false
  }
}

// Export orders
async function exportOrders() {
  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.perPage,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }

    if (searchQuery.value) params.search = searchQuery.value

    if (activeTab.value !== 'all') {
      params.order_status = activeTab.value
    } else if (filters.order_status) {
      params.order_status = filters.order_status
    }
    
    if (filters.payment_status) params.payment_status = filters.payment_status
    if (filters.dateBegin) params.dateBegin = filters.dateBegin
    if (filters.dateEnd) params.dateEnd = filters.dateEnd
    if (filters.priceMin) params.priceMin = filters.priceMin
    if (filters.priceMax) params.priceMax = filters.priceMax

    const token = await getToken.value()
    const response = await axios.get('/api/admin/orders', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: params
    })

    if (response.data.success) {
      const orderData = response.data.data
      const headers = [
      'Order ID',
      'Customer Name',
      'Email',
      'Phone',
      'Shipping Address',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Order Date'
    ]
      let csvContent = "data:text/csvcharset=utf-8," + headers.join(",") + "\n"

      orderData.forEach(order => {
        const row = [
          `"'${formatOrderId(order._id)}"`,
          order.recipient_name,
          order.recipient_email,
          `"'${order.recipient_phone}"`,
          `"${order.shipping_address}"`,
          order.total_amount,
          order.payment_method,
          order.payment_status,
          order.order_status,
          formatDate(order.order_date)
        ]
        csvContent += row.join(",") + "\n"
      })

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Orders exported successfully')
    }
  } catch (err) {
    console.error('Error exporting orders:', err)
    toast.error('Failed to export orders')
  } finally {
    exporting.value = false
  }
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

// Load orders on mount
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped src="@/styling/OrderList.css"></style>