<!--src/views/ProductList.vue-->
<template>
  <div class="product-list-page">
    
    <div class="product-list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Search for SKU, name..." 
          v-model="searchQuery"
          @input="debounceSearch"
        />
      </div>
      
      <div class="header-actions">
        <button 
          v-if="selectedProducts.length > 0" 
          class="btn btn-danger-outline"
          @click="openBulkDeleteModal"
        >
          <i class="fas fa-trash-alt"></i>
          <span>Delete Selected ({{ selectedProducts.length }})</span>
        </button>

        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportToCSV">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
        <router-link to="/admin/products/new" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          <span>New Product</span>
        </router-link>
      </div>
    </div>

    <nav class="product-tabs">
      <button 
        :class="['tab-btn', { 'active': !filters.category_id }]"
        @click="setCategory(null)"
      >
        All Products
      </button>
      <button 
        v-for="cat in categories" 
        :key="cat._id"
        :class="['tab-btn', { 'active': filters.category_id === cat._id }]"
        @click="setCategory(cat._id)"
      >
        {{ cat.category_name }}
      </button>
    </nav>

    <div v-if="loading" class="loading-overlay">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading products...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ error }}</span>
      <button @click="fetchProducts" class="btn btn-secondary btn-sm">Retry</button>
    </div>

    <div v-else class="table-container">
      <table class="product-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                v-model="selectAllModel" 
                :indeterminate="isIndeterminate" 
              />
            </th>
            <th @click="handleSort('name')" class="sortable">
              Product <i :class="getSortIcon('name')"></i>
            </th>
            <th class="sortable">
              Attributes
            </th>
            <th @click="handleSort('selling_price')" class="sortable">
              Price <i :class="getSortIcon('selling_price')"></i>
            </th>
            <th @click="handleSort('current_stock')" class="sortable">
              Stock <i :class="getSortIcon('current_stock')"></i>
            </th>
            <th @click="handleSort('createdAt')" class="sortable">
              Date <i :class="getSortIcon('createdAt')"></i>
            </th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="products.length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem;">
              No products found
            </td>
          </tr>
          <tr v-for="product in products" :key="product._id">
            <td>
              <input type="checkbox" v-model="selectedProducts" :value="product._id" />
            </td>
            <td>
              <div class="product-cell">
                <img 
                  :src="buildImagePath(product.image_urls[0])" 
                  :alt="product.name"
                  @error="handleImageError"
                />
                <div class="product-info">
                  <span class="product-id">{{ product.SKU }}</span>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </div>
            </td>
            <td>
              <span style="font-weight: 400;" v-for="attr in product.attributes" :key="attr._id">
                {{ attr.description }} 
                <br>
              </span>
            </td>
            <td>
              {{ formatPrice(product.selling_price) }}
            </td>
            <td>{{ product.current_stock }}</td>
            <td>
              <div class="date-cell">
                <span>{{ formatDate(product.updatedAt) }}</span>
                <span>{{ formatTime(product.updatedAt) }}</span>
              </div>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="product.current_stock > 0 ? 'available' : 'out-of-stock'"
              >
                {{ product.current_stock > 0 ? 'Available' : 'Out of Stock' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <router-link :to="'/admin/products/view/' + product._id" class="action-btn">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link :to="'/admin/products/edit/' + product._id" class="action-btn">
                  <i class="fas fa-pencil-alt"></i>
                </router-link>
                <button 
                  class="action-btn btn-delete" 
                  @click="openSingleDeleteModal(product._id, product.name)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-footer" v-if="!loading && products.length > 0">
      <span>{{ paginationText }}</span>
      <div class="page-controls">
        <span>Page</span>
        <select v-model.number="currentPage" @change="fetchProducts">
          <option v-for="page in totalPages" :key="page" :value="page">
            {{ page }}
          </option>
        </select>
        <button @click="previousPage" :disabled="currentPage === 1">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="isDeleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>{{ isBulkDelete ? 'Delete Products' : 'Delete Product' }}</h3>
          <button @click="closeDeleteModal" class="close-btn"></button>
        </div>
        <div class="modal-body">
          <p v-if="isBulkDelete">
            Are you sure you want to delete 
            <strong>{{ selectedProducts.length }} selected products</strong>?
            This action cannot be undone.
          </p>
          <p v-else>
            Are you sure you want to delete the product
            <strong>"{{ productToDeleteName }}"</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary" :disabled="deleting">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="deleting">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
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
            <h4>Filter Products</h4>
            <button @click="isFilterVisible = false" class="close-btn"></button>
          </div>
          <div class="filter-body">
            <div class="filter-group">
              <label>Category</label>
              <select v-model="tempFilters.category_id">
                <option value="">All Categories</option>
                <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                  {{ cat.category_name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Product Type</label>
              <select v-model="tempFilters.type_id">
                <option value="">All Types</option>
                <option v-for="type in productTypes" :key="type._id" :value="type._id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Brand</label>
              <select v-model="tempFilters.brand_id">
                <option value="">All Brands</option>
                <option v-for="brand in brands" :key="brand._id" :value="brand._id">
                  {{ brand.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Stock Status</label>
              <select v-model="tempFilters.in_stock">
                <option value="">All</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Price Range (VND)</label>
              <div class="price-inputs">
                <input type="number" placeholder="Min" v-model.number="tempFilters.min_price" />
                <span>-</span>
                <input type="number" placeholder="Max" v-model.number="tempFilters.max_price" />
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
import { ref, computed, onMounted, watch } from 'vue'

import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()

import axios from 'axios'

import { useToast } from 'vue-toastification'
const toast = useToast()

import { 
  formatDate, formatPrice, 
  formatTime, buildImagePath } 
  from '@/utilities/helper.js'

// State
const products = ref([])
const categories = ref([])
const productTypes = ref([])
const brands = ref([])
const loading = ref(false)
const error = ref(null)
const deleting = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = 10
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const paginationText = computed(() => {
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(currentPage.value * pageSize, totalCount.value)
  return `${start} - ${end} of ${totalCount.value} Products`
})

// Search & Filters
const searchQuery = ref('')
const filters = ref({
  category_id: null,
  type_id: '',
  brand_id: '',
  in_stock: '',
  min_price: null,
  max_price: null
})
const tempFilters = ref({ ...filters.value })

// Sorting
const sortField = ref('-createdAt')

// Selection
const selectedProducts = ref([])
const isIndeterminate = computed(() => 
  selectedProducts.value.length > 0 && 
  selectedProducts.value.length < products.value.length
)
const selectAllModel = computed({
  get() {
    return products.value.length > 0 && 
           selectedProducts.value.length === products.value.length
  },
  set(value) {
    if (value) {
      selectedProducts.value = products.value.map(p => p._id)
    } else {
      selectedProducts.value = []
    }
  }
})

// Delete Modal
const isDeleteModalVisible = ref(false)
const productToDeleteId = ref(null)
const productToDeleteName = ref('')
const isBulkDelete = ref(false)

// Filter Panel
const isFilterVisible = ref(false)

// Fetch Products
const fetchProducts = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      sort: sortField.value,
      search: searchQuery.value || undefined,
      ...filters.value
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const token = await getToken.value()

    const response = await axios.get('/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: params
    })
    products.value = response.data.data
    totalCount.value = response.data.pagination.total_items
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products'
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

// Fetch Categories
const fetchCategories = async () => {
  try {
    const token = await getToken.value()

    const response = await axios.get('/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    categories.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// Fetch Product Types
const fetchProductTypes = async () => {
  try {
    const token = await getToken.value()

    const response = await axios.get('/api/admin/product-types', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        category_id: tempFilters.value.category_id
      }
    })
    productTypes.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching product types:', err)
  }
}

// Fetch Brands
const fetchBrands = async () => {
  try {
    const token = await getToken.value()

    const response = await axios.get('/api/admin/brands', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    brands.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching brands:', err)
  }
}

// Category Tab Click
const setCategory = (categoryId) => {
  filters.value.category_id = categoryId
  currentPage.value = 1
  fetchProducts()
}


// Search Debounce
let searchTimeout = null
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
  }, 500)
}

// Sorting
const getSortIcon = (field) => {
  const fieldMap = {
    'name': 'name',
    'selling_price': 'selling_price',
    'current_stock': 'current_stock',
    'createdAt': 'createdAt'
  }
  const mappedField = fieldMap[field]
  if (sortField.value === mappedField) return 'fas fa-sort-up active-sort'
  if (sortField.value === `-${mappedField}`) return 'fas fa-sort-down active-sort'
  return 'fas fa-sort'
}

const handleSort = (field) => {
  const fieldMap = {
    'name': 'name',
    'selling_price': 'selling_price',
    'current_stock': 'current_stock',
    'createdAt': 'createdAt'
  }
  const mappedField = fieldMap[field]
  
  if (sortField.value === mappedField) {
    sortField.value = `-${mappedField}`
  } else {
    sortField.value = mappedField
  }
  fetchProducts()
}

// Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchProducts()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchProducts()
  }
}

// Delete Functions
const openSingleDeleteModal = (id, name) => {
  isBulkDelete.value = false
  productToDeleteId.value = id
  productToDeleteName.value = name
  isDeleteModalVisible.value = true
}

const openBulkDeleteModal = () => {
  isBulkDelete.value = true
  isDeleteModalVisible.value = true
}

const closeDeleteModal = () => {
  isDeleteModalVisible.value = false
  isBulkDelete.value = false
  productToDeleteId.value = null
  productToDeleteName.value = ''
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const token = await getToken.value()
    if (isBulkDelete.value) {
      await axios.delete('/api/admin/products/bulk-delete', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          product_ids: selectedProducts.value
        }
      })
      toast.success(`${selectedProducts.value.length} products deleted successfully`)
      selectedProducts.value = []
    } else {
      await axios.delete(`/api/admin/products/${productToDeleteId.value}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      toast.success('Product deleted successfully')
    }
    closeDeleteModal()
    fetchProducts()
  } catch (err) {
      toast.error('Failed to delete products!')
  } finally {
    deleting.value = false
  }
}

// Filter Functions
watch(() => tempFilters.value.category_id, (newCategoryId) => {
  if (newCategoryId) {
    fetchProductTypes()
  }
})

const applyFilters = () => {
  filters.value = { ...tempFilters.value }
  currentPage.value = 1
  isFilterVisible.value = false
  fetchProducts()
}


const clearFilters = () => {
  tempFilters.value = {
    category_id: null,
    type_id: '',
    brand_id: '',
    in_stock: '',
    min_price: null,
    max_price: null
  }
  filters.value = { ...tempFilters.value }
  currentPage.value = 1
  isFilterVisible.value = false
  fetchProducts()
}

// Export CSV
const exportToCSV = () => {
  const headers = ['SKU', 'Name', 'Price', 'Stock', 'Status']
  let csvContent = "data:text/csvcharset=utf-8," + headers.join(",") + "\n"
  
  products.value.forEach(product => {
    const row = [
      product.SKU,
      `"${product.name}"`,
      product.selling_price,
      product.current_stock,
      product.current_stock > 0 ? 'Available' : 'Out of Stock'
    ]
    csvContent += row.join(",") + "\n"
  })
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `products_export_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Utilities
const handleImageError = (e) => {
  e.target.src = 'https://picsum.photos/300/cccccc/ffffff?text=No+Image'
}

// Initialize
onMounted(() => {
  fetchCategories()
  fetchProductTypes()
  fetchBrands()
  fetchProducts()
})
</script>

<style scoped src="./ProductList.css"></style>