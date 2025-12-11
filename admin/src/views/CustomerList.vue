<template>
  <div class="customer-list-page">
    <div class="list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          @input="debouncedSearch"
          placeholder="Search by username or email..." 
        />
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportToCSV">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
      </div>
    </div>

    <!-- Customer Table -->
    <div class="table-container">
      <table class="customer-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Account Status</th>
            <th>Registered</th>
            <th>Last Login</th>
            <th class="action-header">Action</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary-color);"></i>
              <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading customers...</p>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="customers.length === 0">
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No customers found
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="customer in customers" :key="customer._id" :class="{ 'locked': customer.account_status === 'locked' }">
            <td>
              <span class="customer-name">{{ customer.username }}</span>
            </td>
            <td>{{ customer.email }}</td>
            <td>
              <span 
                class="status-badge" 
                :class="{
                  'status-active': customer.account_status === 'active',
                  'status-banned': customer.account_status === 'locked',
                  'status-inactive': customer.account_status === 'inactive'
                }"
              >
                {{ customer.account_status }}
              </span>
            </td>
            <td>{{ formatDate(customer.createdAt) }}</td>
            <td>{{ formatDate(customer.last_login) }}</td>
            
            <td>
              <div class="action-buttons">
                <button 
                  v-if="customer.account_status === 'locked'" 
                  class="action-btn btn-unlock" 
                  @click="openLockModal(customer, false)"
                >
                  <i class="fas fa-check-circle"></i>
                  <span>Unlock</span>
                </button>
                
                <button 
                  v-else 
                  class="action-btn btn-lock"
                  @click="openLockModal(customer, true)"
                >
                  <i class="fas fa-ban"></i>
                  <span>Lock</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="pagination-footer">
      <span>{{ paginationText }}</span>
      <div class="page-controls">
        <span>The page on</span>
        <select v-model="currentPage" @change="fetchCustomers">
          <option v-for="page in pagination.totalPages" :key="page" :value="page">
            {{ page }}
          </option>
        </select>
        <button @click="previousPage" :disabled="!pagination.hasPrevPage">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="nextPage" :disabled="!pagination.hasNextPage">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Lock/Unlock Modal -->
    <div v-if="isLockModalVisible" class="modal-overlay" @click.self="closeLockModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas info-icon" :class="isLocking ? 'fa-user-lock' : 'fa-user-check'"></i>
          <h3>{{ isLocking ? 'Lock Account' : 'Unlock Account' }}</h3>
          <button @click="closeLockModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p v-if="isLocking">
            Are you sure you want to <strong>lock</strong> the account for
            <strong>"{{ customerToLock?.username }}"</strong>?
            They will not be able to log in.
          </p>
          <p v-else>
            Are you sure you want to <strong>unlock</strong> the account for
            <strong>"{{ customerToLock?.username }}"</strong>?
            They will regain access to their account.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeLockModal" class="btn btn-secondary" :disabled="actionLoading">
            Cancel
          </button>
          <button 
            @click="confirmLockToggle" 
            class="btn" 
            :class="isLocking ? 'btn-danger' : 'btn-success'"
            :disabled="actionLoading"
          >
            <i v-if="actionLoading" class="fas fa-spinner fa-spin"></i>
            <span v-else>{{ isLocking ? 'Lock' : 'Unlock' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Filter Panel -->
    <Teleport to="body">
      <div 
        class="filter-panel-overlay" 
        :class="{ 'open': isFilterVisible }"
        @click.self="isFilterVisible = false"
      >
        <div class="filter-panel">
          <div class="filter-header">
            <h4>Filter Customers</h4>
            <button @click="isFilterVisible = false" class="close-btn">&times;</button>
          </div>
          
          <div class="filter-body">
            <!-- Account Status Filter -->
            <div class="filter-group">
              <label>Account Status</label>
              <select v-model="filters.account_status">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="locked">Locked</option>
              </select>
            </div>

            <!-- Registration Date Filter -->
            <div class="filter-group">
              <label>Registration Date</label>
              <div class="date-inputs">
                <input type="date" v-model="filters.dateBegin" />
                <span>to</span>
                <input type="date" v-model="filters.dateEnd" />
              </div>
            </div>

            <!-- Last Login Date Filter -->
            <div class="filter-group">
              <label>Last Login Date</label>
              <div class="date-inputs">
                <input type="date" v-model="filters.lastLoginBegin" />
                <span>to</span>
                <input type="date" v-model="filters.lastLoginEnd" />
              </div>
            </div>
          </div>

          <div class="filter-footer">
            <button @click="clearFilters" class="btn btn-secondary">
              Clear All
            </button>
            <button @click="applyFilters" class="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <i class="fas" :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@clerk/vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utilities/helper'

// Auth
const { getToken } = useAuth()
const toast = useToast()

// Data
const customers = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pagination = ref({
  currentPage: 1,
  perPage: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
})

// Filters
const filters = ref({
  account_status: '',
  dateBegin: '',
  dateEnd: '',
  lastLoginBegin: '',
  lastLoginEnd: '',
})

// Modal
const isLockModalVisible = ref(false)
const customerToLock = ref(null)
const isLocking = ref(false)

// Filter Panel
const isFilterVisible = ref(false)


// Computed
const paginationText = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.perPage + 1
  const end = Math.min(
    pagination.value.currentPage * pagination.value.perPage,
    pagination.value.totalItems
  )
  return `${start} - ${end} of ${pagination.value.totalItems} customers`
})

// Methods
async function fetchCustomers() {
  loading.value = true
  try {
    const token = await getToken.value()
    
    const params = {
      page: currentPage.value,
      limit: 10,
      search: searchQuery.value,
      ...filters.value,
    }

    // Remove empty filter values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await axios.get('/api/admin/customers', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.data.success) {
      customers.value = response.data.data
      pagination.value = response.data.pagination
    } else {
      toast.error('Failed to fetch customers')
    }
  } catch (error) {
    console.error('Fetch customers error:', error)
    toast.error('Failed to fetch customers')
  } finally {
    loading.value = false
  }
}

// Debounced search
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page on search
    fetchCustomers()
  }, 500)
}

function previousPage() {
  if (pagination.value.hasPrevPage) {
    currentPage.value--
    fetchCustomers()
  }
}

function nextPage() {
  if (pagination.value.hasNextPage) {
    currentPage.value++
    fetchCustomers()
  }
}

function openLockModal(customer, lock) {
  customerToLock.value = customer
  isLocking.value = lock
  isLockModalVisible.value = true
}

function closeLockModal() {
  isLockModalVisible.value = false
  customerToLock.value = null
}

async function confirmLockToggle() {
  if (!customerToLock.value) return
  
  actionLoading.value = true
  try {
    const token = await getToken.value()
    const action = isLocking.value ? 'lock' : 'unlock'
    
    const response = await axios.put(
      `/api/admin/customers/${customerToLock.value._id}/${action}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.data.success) {
      toast.success(response.data.message, 'success')
      closeLockModal()
      fetchCustomers() // Refresh the list
    } else {
      showToast(response.data.message || 'Operation failed', 'error')
    }
  } catch (error) {
    console.error('Lock/Unlock error:', error)
    toast.error('Failed to lock/unlock user')
  } finally {
    actionLoading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  fetchCustomers()
  isFilterVisible.value = false
}

function clearFilters() {
  filters.value = {
    account_status: '',
    dateBegin: '',
    dateEnd: '',
    lastLoginBegin: '',
    lastLoginEnd: '',
  }
  currentPage.value = 1
  fetchCustomers()
  isFilterVisible.value = false
}

async function exportToCSV() {
  try {
    const token = await getToken.value()
    
    const params = {
      limit: 1000,
      search: searchQuery.value,
      ...filters.value,
    }

    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await axios.get('/api/admin/customers', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.data.success) {
      const allCustomers = response.data.data
      
      const headers = ['Username', 'Email', 'Account Status', 'Registered', 'Last Login']
      let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
      
      allCustomers.forEach(customer => {
        const row = [
          `"${customer.username}"`,
          customer.email,
          customer.account_status,
          formatDate(customer.createdAt),
          formatDate(customer.last_login),
        ]
        csvContent += row.join(",") + "\n"
      })
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Customers exported successfully')
    }
  } catch (error) {
    toast.error('Failed to export customers')
  }
}

// Lifecycle
onMounted(() => {
  fetchCustomers()
})
</script>

<style src="@/styling/CustomerList.css"></style>