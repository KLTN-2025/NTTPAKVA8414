<template>
  <div class="supplier-list-page">
    <!-- Actions Bar -->
    <div class="actions-bar">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Search by name, email, phone..." 
        />
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-primary" @click="openSupplierModal(null)">
          <i class="fas fa-plus"></i>
          <span>Add Supplier</span>
        </button>
      </div>
    </div>

    <!-- Suppliers Table -->
    <div class="table-container">
      <div v-if="loading" class="table-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading suppliers...</span>
      </div>

      <table v-else class="suppliers-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th style="font-size: 14px; font-weight: 500;">Name</th>
            <th style="font-size: 14px; font-weight: 500;">Email</th>
            <th style="font-size: 14px; font-weight: 500;">Phone</th>
            <th style="font-size: 14px; font-weight: 500;" class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="suppliers.length === 0">
            <tr>
              <td colspan="5" class="empty-state">
                <i class="fas fa-truck"></i>
                <span>No suppliers found</span>
              </td>
            </tr>
          </template>

          <template v-for="supplier in suppliers" :key="supplier._id">
            <!-- Supplier Row -->
            <tr class="supplier-row" :class="{ 'expanded': expandedSupplierId === supplier._id }">
              <td class="col-expand">
                <button 
                  class="expand-btn"
                  @click="toggleExpand(supplier._id)"
                >
                  <i :class="['fas', expandedSupplierId === supplier._id ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
                </button>
              </td>
              <td>
                <span class="supplier-name">{{ supplier.name }}</span>
              </td>
              <td>
                <span class="supplier-email">{{ supplier.email || '-' }}</span>
              </td>
              <td>
                <span class="supplier-phone">{{ supplier.phone }}</span>
              </td>
              <td class="col-actions">
                <div class="action-buttons">
                  <button class="action-btn btn-edit" @click="openSupplierModal(supplier)">
                    <i class="fas fa-edit"></i>
                    Edit
                  </button>
                  <button class="action-btn btn-delete" @click="openDeleteModal(supplier)">
                    <i class="fas fa-trash-alt"></i>
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <!-- Expanded Orders Row -->
            <tr v-if="expandedSupplierId === supplier._id" class="orders-row">
              <td colspan="5">
                <SupplyOrderList
                  :ref="el => setOrderListRef(supplier._id, el)"
                  :supplier-id="supplier._id"
                  :supplier-name="supplier.name"
                  :is-expanded="expandedSupplierId === supplier._id"
                  @change-status="handleStatusChange"
                  @receive-order="handleReceiveOrder"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-footer">
      <span>{{ paginationText }}</span>
      <div class="page-controls">
        <span>Page</span>
        <select v-model="currentPage" @change="fetchSuppliers">
          <option v-for="page in totalPages" :key="page" :value="page">{{ page }}</option>
        </select>
        <button @click="prevPage" :disabled="currentPage <= 1">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="nextPage" :disabled="currentPage >= totalPages">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Supplier Form Modal -->
    <SupplierFormModal
      v-if="isSupplierModalVisible"
      :supplier="selectedSupplier"
      :loading="modalLoading"
      @close="closeSupplierModal"
      @submit="handleSupplierSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="isDeleteModalVisible"
      title="Delete Supplier"
      :message="`Are you sure you want to delete <strong>${supplierToDelete?.name}</strong>? This action cannot be undone.`"
      confirm-text="Delete"
      type="danger"
      :loading="modalLoading"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />

    <!-- Status Change Confirmation Modal -->
    <ConfirmationModal
      v-if="isStatusModalVisible"
      title="Submit Order"
      :message="`Are you sure you want to change order status to <strong>Ordered</strong>? The order items will be locked for editing.`"
      confirm-text="Confirm"
      type="info"
      :loading="modalLoading"
      @close="closeStatusModal"
      @confirm="confirmStatusChange"
    />

    <!-- Filter Panel -->
    <Teleport to="body">
      <div 
        class="filter-panel-overlay" 
        :class="{ 'open': isFilterVisible }"
        @click.self="isFilterVisible = false"
      >
        <div class="filter-panel">
          <div class="filter-header">
            <h4>Filter Suppliers</h4>
            <button class="close-btn" @click="isFilterVisible = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="filter-body">
            <div class="filter-group">
              <label>Name</label>
              <input 
                type="text" 
                v-model="filters.name" 
                placeholder="Filter by name"
              />
            </div>

            <div class="filter-group">
              <label>Email</label>
              <input 
                type="text" 
                v-model="filters.email" 
                placeholder="Filter by email"
              />
            </div>

            <div class="filter-group">
              <label>Phone</label>
              <input 
                type="tel" 
                pattern="(\+84|0)\d{9,10}"
                v-model="filters.phone" 
                placeholder="Filter by phone"
              />
            </div>
          </div>

          <div class="filter-footer">
            <button class="btn btn-secondary" @click="clearFilters">
              Clear
            </button>
            <button class="btn btn-primary" @click="applyFilters">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuth } from '@clerk/vue'
import axios from 'axios'
import SupplierFormModal from '@/components/SupplierFormModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import SupplyOrderList from '@/components/SupplyOrderList.vue'

const router = useRouter()
const toast = useToast()
const { getToken } = useAuth()
// Data
const suppliers = ref([])
const loading = ref(false)
const searchQuery = ref('')
const expandedSupplierId = ref(null)

// Pagination
const currentPage = ref(1)
const perPage = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value) || 1)
const paginationText = computed(() => {
  const start = (currentPage.value - 1) * perPage.value + 1
  const end = Math.min(currentPage.value * perPage.value, totalItems.value)
  return totalItems.value > 0 ? `${start} - ${end} of ${totalItems.value}` : 'No results'
})

// Filters
const isFilterVisible = ref(false)
const filters = reactive({
  name: '',
  email: '',
  phone: ''
})
const appliedFilters = reactive({
  name: '',
  email: '',
  phone: ''
})

// Modals
const isSupplierModalVisible = ref(false)
const selectedSupplier = ref(null)
const isDeleteModalVisible = ref(false)
const supplierToDelete = ref(null)
const isStatusModalVisible = ref(false)
const orderToChangeStatus = ref(null)
const modalLoading = ref(false)

// Refs for inline order lists
const orderListRefs = {}

function setOrderListRef(supplierId, el) {
  if (el) {
    orderListRefs[supplierId] = el
  }
}

// Fetch suppliers
async function fetchSuppliers() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value
    }

    if (searchQuery.value) {
      params.name = searchQuery.value
      params.email = searchQuery.value
      params.phone = searchQuery.value
    }

    if (appliedFilters.name) params.name = appliedFilters.name
    if (appliedFilters.email) params.email = appliedFilters.email
    if (appliedFilters.phone) params.phone = appliedFilters.phone

    const token = await getToken.value()
    const response = await axios.get('/api/admin/suppliers', { 
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: params 
    })

    if (response.data?.success) {
      suppliers.value = response.data.data
      totalItems.value = response.data.pagination.totalItems
    }
  } catch (err) {
    console.error('Failed to fetch suppliers:', err)
    toast.error('Failed to load suppliers')
  } finally {
    loading.value = false
  }
}

// Search handling with debounce
let searchDebounce = null
function handleSearch() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchSuppliers()
  }, 300)
}

// Pagination
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchSuppliers()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchSuppliers()
  }
}

// Expand/Collapse
function toggleExpand(supplierId) {
  expandedSupplierId.value = expandedSupplierId.value === supplierId ? null : supplierId
}

// Supplier Modal
function openSupplierModal(supplier) {
  selectedSupplier.value = supplier
  isSupplierModalVisible.value = true
}

function closeSupplierModal() {
  isSupplierModalVisible.value = false
  selectedSupplier.value = null
}

async function handleSupplierSubmit(formData) {
  modalLoading.value = true
  try {
    const token = await getToken.value()
    if (selectedSupplier.value) {
      // Update
      const response = await axios.put(`/api/admin/suppliers/${selectedSupplier.value._id}`, formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (response.data?.success) {
        toast.success('Supplier updated successfully')
        closeSupplierModal()
        fetchSuppliers()
      }
    } else {
      // Create
      const response = await axios.post('/api/admin/suppliers', formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      if (response.data?.success) {
        toast.success('Supplier created successfully')
        closeSupplierModal()
        fetchSuppliers()
      }
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Operation failed'
    toast.error(message)
  } finally {
    modalLoading.value = false
  }
}

// Delete Modal
function openDeleteModal(supplier) {
  supplierToDelete.value = supplier
  isDeleteModalVisible.value = true
}

function closeDeleteModal() {
  isDeleteModalVisible.value = false
  supplierToDelete.value = null
}

async function confirmDelete() {
  if (!supplierToDelete.value) return

  modalLoading.value = true
  try {
    const token = await getToken.value()
    const response = await axios.delete(`/api/admin/suppliers/${supplierToDelete.value._id}`,  
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    if (response.data?.success) {
      toast.success('Supplier deleted successfully')
      closeDeleteModal()
      fetchSuppliers()
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to delete supplier'
    toast.error(message)
  } finally {
    modalLoading.value = false
  }
}

// Status Change Modal (Draft → Ordered)
function handleStatusChange(order, newStatus) {
  orderToChangeStatus.value = { order, newStatus }
  isStatusModalVisible.value = true
}

function closeStatusModal() {
  isStatusModalVisible.value = false
  orderToChangeStatus.value = null
}

async function confirmStatusChange() {
  if (!orderToChangeStatus.value) return

  const { order, newStatus } = orderToChangeStatus.value

  modalLoading.value = true
  try {
    const token = await getToken.value()
    const response = await axios.patch(`/api/admin/supply-orders/${order._id}/status`, {
      status: newStatus
    }, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      }  
    })

    if (response.data?.success) {
      toast.success(`Order status changed to ${newStatus}`)
      closeStatusModal()
      
      // Refresh the inline order list
      const supplierId = order.supplier_id?._id || order.supplier_id
      if (orderListRefs[supplierId]) {
        orderListRefs[supplierId].refresh()
      }
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to update order status'
    toast.error(message)
  } finally {
    modalLoading.value = false
  }
}

// Navigate to receive order page
function handleReceiveOrder(order) {
  router.push({
    name: 'admin-supply-order-view',
    params: { id: order._id }
  })
}

// Filters
function applyFilters() {
  Object.assign(appliedFilters, filters)
  currentPage.value = 1
  isFilterVisible.value = false
  fetchSuppliers()
}

function clearFilters() {
  filters.name = ''
  filters.email = ''
  filters.phone = ''
  appliedFilters.name = ''
  appliedFilters.email = ''
  appliedFilters.phone = ''
  currentPage.value = 1
  isFilterVisible.value = false
  fetchSuppliers()
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style src="@/styling/SupplierList.css"></style>