<!-- views/CustomerSupport.vue -->
<template>
  <div class="customer-support-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-stats">
        <div class="stat-badge stat-unresolved">
          <span class="stat-count">{{ summary.Unresolved }}</span>
          <span class="stat-label">Unresolved</span>
        </div>
        <div class="stat-badge stat-resolving">
          <span class="stat-count">{{ summary.Resolving }}</span>
          <span class="stat-label">Resolving</span>
        </div>
        <div class="stat-badge stat-resolved">
          <span class="stat-count">{{ summary.Resolved }}</span>
          <span class="stat-label">Resolved</span>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-row">
        <!-- Search -->
        <div class="filter-group search-group">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text" id="inquiry-search"
            v-model="filters.search"
            placeholder="Search by sender name..."
            @input="debouncedSearch"
            class="search-input"
          />
          <button 
            v-if="filters.search" 
            @click="clearSearch" 
            class="clear-search-btn"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label for="statusFilter">Status</label>
          <select id="statusFilter" v-model="filters.status" @change="fetchInquiries(1)">
            <option value="">All Status</option>
            <option value="Unresolved">Unresolved</option>
            <option value="Resolving">Resolving</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <!-- Problem Type Filter -->
        <div class="filter-group">
          <label for="typeFilter">Problem Type</label>
          <select id="typeFilter" v-model="filters.problemType" @change="fetchInquiries(1)">
            <option value="">All Types</option>
            <option v-for="type in problemTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>

        <!-- Date Range Filters -->
        <div class="filter-group">
          <label for="dateFrom">From Date</label>
          <input 
            type="date" 
            id="dateFrom" 
            v-model="filters.dateFrom" 
            @change="fetchInquiries(1)"
          />
        </div>

        <div class="filter-group">
          <label for="dateTo">To Date</label>
          <input 
            type="date" 
            id="dateTo" 
            v-model="filters.dateTo" 
            @change="fetchInquiries(1)"
          />
        </div>

        <!-- Clear Filters Button -->
        <button 
          @click="clearFilters" 
          class="filter-group clear-filters-btn"
        >
        <span>
          <i class="fas fa-filter-circle-xmark"></i>
          Clear Filters
        </span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading inquiries...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Failed to load inquiries</h3>
      <p>{{ error }}</p>
      <button @click="fetchInquiries()" class="btn btn-primary">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="inquiries.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <h3>No inquiries found</h3>
      <p v-if="hasActiveFilters">Try adjusting your filters to see more results.</p>
      <p v-else>There are no customer inquiries at this time.</p>
    </div>

    <!-- Inquiries Table -->
    <div v-else class="table-container">
      <table class="inquiries-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Sender Name</th>
            <th>Problem Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inquiry in inquiries" :key="inquiry._id">
            <td class="date-cell">
              <span class="date-primary">{{ formatDate(inquiry.createdAt) }}</span>
              <span class="date-secondary">{{ formatTime(inquiry.createdAt) }}</span>
            </td>
            <td class="sender-cell">
              <div class="sender-info">
                <span class="sender-name">{{ inquiry.sender_name }}</span>
                <span class="sender-phone">{{ inquiry.sender_phone }}</span>
              </div>
            </td>
            <td>
              <span class="problem-type-badge">{{ inquiry.problem_type }}</span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(inquiry.status)]">
                {{ inquiry.status }}
              </span>
            </td>
            <td>
              <button 
                @click="openDetailModal(inquiry)" 
                class="action-btn view-btn"
                title="View Details"
              >
                <i class="fas fa-eye"></i>
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total_pages > 1" class="pagination-container">
      <div class="pagination-info">
        Showing {{ paginationStart }} - {{ paginationEnd }} of {{ pagination.total_items }} inquiries
      </div>
      <div class="pagination-controls">
        <button 
          @click="fetchInquiries(pagination.current_page - 1)"
          :disabled="!pagination.has_prev_page"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-left"></i>
          Previous
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="fetchInquiries(page)"
            :class="['page-number', { active: page === pagination.current_page }]"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="fetchInquiries(pagination.current_page + 1)"
          :disabled="!pagination.has_next_page"
          class="pagination-btn"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Inquiry Details</h2>
          <button @click="closeModal" class="modal-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="selectedInquiry" class="modal-body">
          <!-- Inquiry Info -->
          <div class="detail-section">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Sender Name</label>
                <span>{{ selectedInquiry.sender_name }}</span>
              </div>
              <div class="detail-item">
                <label>Phone Number</label>
                <span>
                  <a :href="`tel:${selectedInquiry.sender_phone}`" class="phone-link">
                    {{ selectedInquiry.sender_phone }}
                  </a>
                </span>
              </div>
              <div class="detail-item" v-if="selectedInquiry.sender_email">
                <label>Email</label>
                <span>
                  <a :href="`mailto:${selectedInquiry.sender_email}`" class="email-link">
                    {{ selectedInquiry.sender_email }}
                  </a>
                </span>
              </div>
              <div class="detail-item">
                <label>Submitted On</label>
                <span>{{ formatFullDateTime(selectedInquiry.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Problem Type</label>
                <span class="type-badge">{{ selectedInquiry.problem_type }}</span>
              </div>
              <div class="detail-item">
                <label>Current Status</label>
                <span class="type-badge">
                  {{ selectedInquiry.status }}
                </span>
              </div>
            </div>

          </div>

          <div class="detail-section">
            <div class="detail-item full-width">
              <label>Details</label>
              <p class="details-text">{{ selectedInquiry.details }}</p>
            </div>
          </div>

          <!-- Admin Notes -->
          <div class="detail-section">
            <h3>Admin Notes</h3>
            <div class="admin-notes-container">
              <textarea
                v-model="adminNotes"
                placeholder="Add notes about this inquiry (optional)..."
                maxlength="500"
                rows="3"
              ></textarea>
              <span class="char-count">{{ adminNotes.length }}/500</span>
            </div>
          </div>

          <!-- Status Update -->
          <div class="detail-section">
            <div class="status-buttons">
              <button
                @click="updateStatus('Unresolved')"
                :class="['status-update-btn', 'btn-unresolved', { active: selectedInquiry.status === 'Unresolved' }]"
                :disabled="updatingStatus"
              >
                <i class="fas fa-clock"></i>
                Unresolved
              </button>
              <button
                @click="updateStatus('Resolving')"
                :class="['status-update-btn', 'btn-resolving', { active: selectedInquiry.status === 'Resolving' }]"
                :disabled="updatingStatus"
              >
                <i class="fas fa-spinner"></i>
                Resolving
              </button>
              <button
                @click="updateStatus('Resolved')"
                :class="['status-update-btn', 'btn-resolved', { active: selectedInquiry.status === 'Resolved' }]"
                :disabled="updatingStatus"
              >
                <i class="fas fa-check-circle"></i>
                Resolved
              </button>
            </div>
          </div>

          <!-- Resolved Info -->
          <div v-if="selectedInquiry.resolved_at" class="detail-section resolved-info">
            <p>
              <i class="fas fa-check"></i>
              Resolved on {{ formatFullDateTime(selectedInquiry.resolved_at) }}
              <span v-if="selectedInquiry.resolved_by">
                by {{ selectedInquiry.resolved_by.name || 'Admin' }}
              </span>
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Close</button>
          <button 
            @click="deleteInquiry" 
            class="btn btn-danger"
            :disabled="deletingInquiry"
          >
            <i v-if="deletingInquiry" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
import { useToast } from 'vue-toastification'

const { getToken } = useAuth()
const toast = useToast()

// State
const inquiries = ref([])
const loading = ref(true)
const error = ref(null)
const showModal = ref(false)
const selectedInquiry = ref(null)
const adminNotes = ref('')
const updatingStatus = ref(false)
const deletingInquiry = ref(false)

const problemTypes = ref([
  'Orders',
  'Products',
  'Shipping & Delivery',
  'Payment',
  'Website Bug',
  'Feedback & Suggestion',
  'Other'
])

const summary = reactive({
  Unresolved: 0,
  Resolving: 0,
  Resolved: 0,
  total: 0
})

const pagination = reactive({
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 0,
  has_next_page: false,
  has_prev_page: false
})

const filters = reactive({
  search: '',
  status: '',
  problemType: '',
  dateFrom: '',
  dateTo: ''
})

// Debounce timer for search
let searchTimeout = null

// Computed
const hasActiveFilters = computed(() => {
  return filters.search || filters.status || filters.problemType || filters.dateFrom || filters.dateTo
})

const visiblePages = computed(() => {
  const pages = []
  const total = pagination.total_pages
  const current = pagination.current_page

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else if (end === total) {
      start = Math.max(1, end - 4)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const paginationStart = computed(() => {
  return (pagination.current_page - 1) * pagination.per_page + 1
})

const paginationEnd = computed(() => {
  return Math.min(pagination.current_page * pagination.per_page, pagination.total_items)
})

// Methods
async function fetchInquiries(page = 1) {
  loading.value = true
  error.value = null

  try {
    const token = await getToken.value()
    
    const params = {
      page,
      limit: 10
    }

    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.problemType) params.problem_type = filters.problemType
    if (filters.dateFrom) params.date_from = filters.dateFrom
    if (filters.dateTo) params.date_to = filters.dateTo

    const response = await axios.get('/api/admin/support/inquiries', {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (response.data?.success) {
      inquiries.value = response.data.data
      
      // Update pagination
      Object.assign(pagination, response.data.pagination)
      
      // Update summary
      if (response.data.summary) {
        Object.assign(summary, response.data.summary)
      }
    } else {
      throw new Error(response.data?.message || 'Failed to fetch inquiries')
    }

  } catch (err) {
    console.error('Error fetching inquiries:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to load inquiries'
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchInquiries(1)
  }, 300)
}

function clearSearch() {
  filters.search = ''
  fetchInquiries(1)
}

function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.problemType = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  fetchInquiries(1)
}

function openDetailModal(inquiry) {
  selectedInquiry.value = { ...inquiry }
  adminNotes.value = inquiry.admin_notes || ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedInquiry.value = null
  adminNotes.value = ''
}

async function updateStatus(newStatus) {
  if (!selectedInquiry.value || updatingStatus.value) return
  if (selectedInquiry.value.status === newStatus && adminNotes.value === (selectedInquiry.value.admin_notes || '')) {
    return
  }

  updatingStatus.value = true

  try {
    const token = await getToken.value()

    const response = await axios.put(
      `/api/admin/support/inquiries/${selectedInquiry.value._id}/status`,
      {
        status: newStatus,
        admin_notes: adminNotes.value
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (response.data?.success) {
      // Update local state
      selectedInquiry.value.status = newStatus
      selectedInquiry.value.admin_notes = adminNotes.value
      
      if (response.data.data?.resolved_at) {
        selectedInquiry.value.resolved_at = response.data.data.resolved_at
      }

      // Update inquiry in list
      const index = inquiries.value.findIndex(i => i._id === selectedInquiry.value._id)
      if (index !== -1) {
        inquiries.value[index] = { ...selectedInquiry.value }
      }

      // Refresh summary
      fetchInquiries(pagination.current_page)

      toast.success(`Status updated to ${newStatus}`)
      closeModal()
    } else {
      throw new Error(response.data?.message || 'Failed to update status')
    }

  } catch (err) {
    console.error('Error updating status:', err)
    toast.error(err.response?.data?.message || 'Failed to update status')
  } finally {
    updatingStatus.value = false
  }
}

async function deleteInquiry() {
  if (!selectedInquiry.value || deletingInquiry.value) return

  if (!confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
    return
  }

  deletingInquiry.value = true

  try {
    const token = await getToken.value()

    const response = await axios.delete(
      `/api/admin/support/inquiries/${selectedInquiry.value._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (response.data?.success) {
      toast.success('Inquiry deleted successfully')
      closeModal()
      fetchInquiries(pagination.current_page)
    } else {
      throw new Error(response.data?.message || 'Failed to delete inquiry')
    }

  } catch (err) {
    console.error('Error deleting inquiry:', err)
    toast.error(err.response?.data?.message || 'Failed to delete inquiry')
  } finally {
    deletingInquiry.value = false
  }
}

// Formatters
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFullDateTime(dateString) {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusClass(status) {
  switch (status) {
    case 'Unresolved': return 'status-unresolved'
    case 'Resolving': return 'status-resolving'
    case 'Resolved': return 'status-resolved'
    default: return ''
  }
}

// Lifecycle
onMounted(() => {
  fetchInquiries(1)
})
</script>

<style scoped src="@/styling/CustomerSupport.css"></style>