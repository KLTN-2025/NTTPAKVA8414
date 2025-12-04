<template>
  <div class="transaction-management-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-actions">
        <div class="last-updated" :class="{ 'stale': isDataStale }">
          <span style="font-size: 1rem;" v-if="lastUpdated">
            Updated {{ formatTimeAgo(lastUpdated) }}
          </span>
          <button 
            class="btn btn-refresh" 
            @click="handleRefresh" 
            :disabled="refreshing"
            :title="refreshing ? 'Refreshing...' : 'Refresh data'"
          >
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
          </button>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i>
          <span>New Transaction</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <TransactionSummaryCards 
      :summary="summary"
      :loading="summaryLoading"
      :selectedPeriod="selectedPeriod"
      @select-period="handlePeriodSelect"
    />

    <!-- Chart -->
    <TransactionChart 
      :chartData="chartData"
      :period="selectedPeriod"
      :loading="summaryLoading"
    />

    <!-- Transaction List Section -->
    <div class="list-section">
      <div class="list-header">
        <h2>Transaction List</h2>
      </div>

      <!-- Filters -->
      <TransactionFilters 
        :filters="filters"
        @apply-filters="applyFilters"
        @reset-filters="resetFilters"
      />

      <!-- Table -->
      <TransactionList 
        :transactions="transactions"
        :loading="listLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
        @view-reference="handleViewReference"
        @delete-transaction="handleDeleteTransaction"
      />
    </div>

    <!-- Create Transaction Modal -->
    <TransactionFormModal 
      v-if="isCreateModalVisible"
      @close="closeCreateModal"
      @created="handleTransactionCreated"
    />

    <!-- Order Preview Modal -->
    <OrderPreviewModal 
      v-if="orderPreview.visible"
      :order="orderPreview.data"
      :loading="orderPreview.loading"
      @close="closeOrderPreview"
    />

    <!-- Supply Order Preview Modal -->
    <SupplyOrderPreviewModal 
      v-if="supplyOrderPreview.visible"
      :supplyOrder="supplyOrderPreview.data"
      :loading="supplyOrderPreview.loading"
      @close="closeSupplyOrderPreview"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <i class="fas" :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteModal.visible" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>Delete Transaction</h3>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this transaction?</p>
          <p class="delete-details">
            <strong>{{ deleteModal.transaction?.categoryDisplay }}</strong> - 
            {{ formatPrice(deleteModal.transaction?.amount) }}
          </p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">Cancel</button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="deleteModal.loading">
            {{ deleteModal.loading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { formatPrice } from '@/utilities/helper'
import { useToast } from 'vue-toastification'
const toast = useToast()

import TransactionSummaryCards from '@/components/SummaryCards.vue'
import TransactionChart from '@/components/TransactionChart.vue'
import TransactionList from '@/components/TransactionList.vue'
import TransactionFilters from '@/components/TransactionFilters.vue'
import TransactionFormModal from '@/components/TransactionFormModal.vue'
import OrderPreviewModal from '@/components/OrderPreviewModal.vue'
import SupplyOrderPreviewModal from '@/components/SupplyOrderPreviewModal.vue'

const summary = ref({
  today: { net: 0, inflow: 0, outflow: 0 },
  week: { net: 0, inflow: 0, outflow: 0 },
  month: { net: 0, inflow: 0, outflow: 0 },
  year: { net: 0, inflow: 0, outflow: 0 }
})
const chartData = ref({
  labels: [],
  data: { inflow: [], outflow: [] }
})
const selectedPeriod = ref('today')
const summaryLoading = ref(false)
const lastUpdated = ref(null)
const refreshing = ref(false)

const STALE_THRESHOLD = 10 * 60 * 1000

const isDataStale = computed(() => {
  if (!lastUpdated.value) return false
  return Date.now() - new Date(lastUpdated.value).getTime() > STALE_THRESHOLD
})

const transactions = ref([])
const listLoading = ref(false)
const pagination = ref({
  currentPage: 1,
  perPage: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
})

const filters = reactive({
  type: '',
  dateFrom: '',
  dateTo: ''
})

const isCreateModalVisible = ref(false)
const orderPreview = reactive({
  visible: false,
  loading: false,
  data: null
})
const supplyOrderPreview = reactive({
  visible: false,
  loading: false,
  data: null
})
const deleteModal = reactive({
  visible: false,
  loading: false,
  transaction: null
})


function formatTimeAgo(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffSecs < 60) {
    return 'just now'
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }
}

async function fetchSummary(period = 'today') {
  try {
    summaryLoading.value = true
    const response = await axios.get('/api/admin/transactions/summary', {
      params: { chartPeriod: period }
    })
    
    if (response.data.success) {
      summary.value = response.data.summary
      chartData.value = {
        labels: response.data.chart.labels,
        data: response.data.chart.data
      }
      if (response.data.lastUpdated) {
        lastUpdated.value = response.data.lastUpdated
      }
    }
  } catch (err) {
    toast.error('Failed to load summary data')
  } finally {
    summaryLoading.value = false
  }
}

async function handleRefresh() {
  try {
    refreshing.value = true
    const response = await axios.post('/api/admin/transactions/summary/refresh', null, {
      params: { chartPeriod: selectedPeriod.value }
    })
    
    if (response.data.success) {
      summary.value = response.data.summary
      chartData.value = {
        labels: response.data.chart.labels,
        data: response.data.chart.data
      }
      if (response.data.lastUpdated) {
        lastUpdated.value = response.data.lastUpdated
      }
      toast.success('Data refreshed successfully')
    }
  } catch (err) {
    toast.error('Failed to refresh data')
  } finally {
    refreshing.value = false
  }
}

async function fetchTransactions(page = 1) {
  try {
    listLoading.value = true
    const params = {
      page,
      limit: pagination.value.perPage
    }
    
    if (filters.type) params.type = filters.type
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo

    const response = await axios.get('/api/admin/transactions', { params })
    
    if (response.data.success) {
      transactions.value = response.data.data
      pagination.value = response.data.pagination
    }
  } catch (err) {
  } finally {
    listLoading.value = false
  }
}

function handlePeriodSelect(period) {
  selectedPeriod.value = period
  fetchSummary(period)
}

function handlePageChange(page) {
  fetchTransactions(page)
}

function applyFilters(newFilters) {
  Object.assign(filters, newFilters)
  fetchTransactions(1)
}

function resetFilters() {
  filters.type = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  fetchTransactions(1)
}

function openCreateModal() {
  isCreateModalVisible.value = true
}

function closeCreateModal() {
  isCreateModalVisible.value = false
}

function handleTransactionCreated() {
  closeCreateModal()
  toast.success('Transaction created successfully')
  fetchTransactions(1)
  fetchSummary(selectedPeriod.value)
}

async function handleViewReference(transaction) {
  if (transaction.ref_type === 'CustomerOrder' && transaction.ref_id) {
    await openOrderPreview(transaction.ref_id)
  } else if (transaction.ref_type === 'SupplyOrder' && transaction.ref_id) {
    await openSupplyOrderPreview(transaction.ref_id)
  }
}

// Open order preview
async function openOrderPreview(orderId) {
  try {
    orderPreview.visible = true
    orderPreview.loading = true
    orderPreview.data = null

    const response = await axios.get(`/api/admin/transactions/preview/order/${orderId}`)
    
    if (response.data.success) {
      orderPreview.data = response.data.data
    }
  } catch (err) {
    toast.error('Failed to load order details')
    orderPreview.visible = false
  } finally {
    orderPreview.loading = false
  }
}

// Close order preview
function closeOrderPreview() {
  orderPreview.visible = false
  orderPreview.data = null
}

// Open supply order preview
async function openSupplyOrderPreview(supplyOrderId) {
  try {
    supplyOrderPreview.visible = true
    supplyOrderPreview.loading = true
    supplyOrderPreview.data = null

    const response = await axios.get(`/api/admin/transactions/preview/supply-order/${supplyOrderId}`)
    
    if (response.data.success) {
      supplyOrderPreview.data = response.data.data
    }
  } catch (err) {
    supplyOrderPreview.visible = false
  } finally {
    supplyOrderPreview.loading = false
  }
}

function closeSupplyOrderPreview() {
  supplyOrderPreview.visible = false
  supplyOrderPreview.data = null
}

function handleDeleteTransaction(transaction) {
  if (transaction.is_auto_generated) {
    toast.error('Auto-generated transactions cannot be deleted')
    return
  }
  deleteModal.transaction = transaction
  deleteModal.visible = true
}

function closeDeleteModal() {
  deleteModal.visible = false
  deleteModal.transaction = null
}

async function confirmDelete() {
  if (!deleteModal.transaction) return

  try {
    deleteModal.loading = true
    const response = await axios.delete(`/api/admin/transactions/${deleteModal.transaction._id}`)
    
    if (response.data.success) {
      toast.success('Transaction deleted successfully')
      closeDeleteModal()
      fetchTransactions(pagination.value.currentPage)
      fetchSummary(selectedPeriod.value)
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to delete transaction'
    toast.error(message)
  } finally {
    deleteModal.loading = false
  }
}
onMounted(() => {
  fetchSummary('today')
  fetchTransactions(1)
})
</script>

<style src="./TransactionManagement.css"></style>