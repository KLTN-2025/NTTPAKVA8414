<!-- views/MetadataManagement.vue -->
<template>
  <div class="metadata-page">
    <!-- Tabs -->
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Categories Tab -->
    <div v-show="activeTab === 'categories'">
      <div class="toolbar">
        <div class="search-filter-group">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              v-model="categoryFilters.search"
              type="text"
              placeholder="Search by category name..."
              @input="debouncedFetchCategories"
            />
          </div>
        </div>
        <button class="btn-add" @click="openModal('category', 'add')">
          <i class="fas fa-plus"></i>
          Add Category
        </button>
      </div>

      <div class="table-card">
        <div v-if="categoryLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading categories...</p>
        </div>

        <div v-else-if="categories.length === 0" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No categories found</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Product Types</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat._id">
              <td class="cell-name">{{ cat.category_name }}</td>
              <td class="cell-description" :title="cat.description">
                {{ cat.description || '—' }}
              </td>
              <td>
                <span :class="['cell-count', { zero: cat.typeCount === 0 }]">
                  {{ cat.typeCount }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action btn-view" @click="openModal('category', 'view', cat)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-action btn-edit" @click="openModal('category', 'edit', cat)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-action btn-delete"
                    :disabled="cat.typeCount > 0"
                    :title="cat.typeCount > 0 ? 'Cannot delete: has associated types' : 'Delete'"
                    @click="confirmDelete('category', cat)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="categories.length > 0" class="pagination-container">
          <span class="pagination-info">
            {{ paginationInfo(categoryPagination) }}
          </span>
          <div class="pagination-controls">
            <span>Page</span>
            <select
              v-model="categoryFilters.page"
              class="page-select"
              @change="fetchCategories"
            >
              <option
                v-for="p in categoryPagination.total_pages"
                :key="p"
                :value="p"
              >
                {{ p }}
              </option>
            </select>
            <button
              class="btn-page"
              :disabled="!categoryPagination.has_prev_page"
              @click="categoryFilters.page--; fetchCategories()"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              class="btn-page"
              :disabled="!categoryPagination.has_next_page"
              @click="categoryFilters.page++; fetchCategories()"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Types Tab -->
    <div v-show="activeTab === 'types'">
      <div class="toolbar">
        <div class="search-filter-group">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              v-model="typeFilters.search"
              type="text"
              placeholder="Search by type name..."
              @input="debouncedFetchTypes"
            />
          </div>
          <select
            v-model="typeFilters.category"
            class="filter-select"
            @change="fetchTypes"
          >
            <option value="">All Categories</option>
            <option
              v-for="cat in categoryList"
              :key="cat._id"
              :value="cat._id"
            >
              {{ cat.category_name }}
            </option>
          </select>
        </div>
        <button class="btn-add" @click="openModal('type', 'add')">
          <i class="fas fa-plus"></i>
          Add Type
        </button>
      </div>

      <div class="table-card">
        <div v-if="typeLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading product types...</p>
        </div>

        <div v-else-if="types.length === 0" class="empty-state">
          <i class="fas fa-tags"></i>
          <p>No product types found</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type Name</th>
              <th>Description</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="type in types" :key="type._id">
              <td>
                <span class="cell-category">
                  {{ type.category?.category_name || '—' }}
                </span>
              </td>
              <td class="cell-name">{{ type.name }}</td>
              <td class="cell-description" :title="type.description">
                {{ type.description || '—' }}
              </td>
              <td>
                <span :class="['cell-count', { zero: type.productCount === 0 }]">
                  {{ type.productCount }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action btn-view" @click="openModal('type', 'view', type)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-action btn-edit" @click="openModal('type', 'edit', type)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-action btn-delete"
                    :disabled="type.productCount > 0"
                    :title="type.productCount > 0 ? 'Cannot delete: has associated products' : 'Delete'"
                    @click="confirmDelete('type', type)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="types.length > 0" class="pagination-container">
          <span class="pagination-info">
            {{ paginationInfo(typePagination) }}
          </span>
          <div class="pagination-controls">
            <span>Page</span>
            <select
              v-model="typeFilters.page"
              class="page-select"
              @change="fetchTypes"
            >
              <option
                v-for="p in typePagination.total_pages"
                :key="p"
                :value="p"
              >
                {{ p }}
              </option>
            </select>
            <button
              class="btn-page"
              :disabled="!typePagination.has_prev_page"
              @click="typeFilters.page--; fetchTypes()"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              class="btn-page"
              :disabled="!typePagination.has_next_page"
              @click="typeFilters.page++; fetchTypes()"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Attributes Tab -->
    <div v-show="activeTab === 'attributes'">
      <div class="toolbar">
        <div class="search-filter-group">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              v-model="attributeFilters.search"
              type="text"
              placeholder="Search by attribute description..."
              @input="debouncedFetchAttributes"
            />
          </div>
        </div>
        <button class="btn-add" @click="openModal('attribute', 'add')">
          <i class="fas fa-plus"></i>
          Add Attribute
        </button>
      </div>

      <div class="table-card">
        <div v-if="attributeLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading attributes...</p>
        </div>

        <div v-else-if="attributes.length === 0" class="empty-state">
          <i class="fas fa-list-check"></i>
          <p>No attributes found</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Attribute Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="attr in attributes" :key="attr._id">
              <td class="cell-name">{{ attr.description }}</td>
              <td class="cell-description">{{ attr.slug || '—' }}</td>
              <td>
                <span :class="['cell-count', { zero: attr.productCount === 0 }]">
                  {{ attr.productCount }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action btn-view" @click="openModal('attribute', 'view', attr)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-action btn-edit" @click="openModal('attribute', 'edit', attr)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-action btn-delete"
                    :disabled="attr.productCount > 0"
                    :title="attr.productCount > 0 ? 'Cannot delete: has associated products' : 'Delete'"
                    @click="confirmDelete('attribute', attr)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="attributes.length > 0" class="pagination-container">
          <span class="pagination-info">
            {{ paginationInfo(attributePagination) }}
          </span>
          <div class="pagination-controls">
            <span>Page</span>
            <select
              v-model="attributeFilters.page"
              class="page-select"
              @change="fetchAttributes"
            >
              <option
                v-for="p in attributePagination.total_pages"
                :key="p"
                :value="p"
              >
                {{ p }}
              </option>
            </select>
            <button
              class="btn-page"
              :disabled="!attributePagination.has_prev_page"
              @click="attributeFilters.page--; fetchAttributes()"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              class="btn-page"
              :disabled="!attributePagination.has_next_page"
              @click="attributeFilters.page++; fetchAttributes()"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- View Mode -->
        <div v-if="modal.mode === 'view'" class="modal-body">
          <template v-if="modal.type === 'category'">
            <div class="view-field">
              <div class="view-label">Category Name</div>
              <div class="view-value">{{ modal.data.category_name }}</div>
            </div>
            <div class="view-field">
              <div class="view-label">Description</div>
              <div :class="['view-value', { empty: !modal.data.description }]">
                {{ modal.data.description || 'No description' }}
              </div>
            </div>
            <div class="view-field">
              <div class="view-label">Product Types</div>
              <div class="view-value">{{ modal.data.typeCount }}</div>
            </div>
          </template>

          <template v-else-if="modal.type === 'type'">
            <div class="view-field">
              <div class="view-label">Category</div>
              <div class="view-value">{{ modal.data.category?.category_name || '—' }}</div>
            </div>
            <div class="view-field">
              <div class="view-label">Type Name</div>
              <div class="view-value">{{ modal.data.name }}</div>
            </div>
            <div class="view-field">
              <div class="view-label">Description</div>
              <div :class="['view-value', { empty: !modal.data.description }]">
                {{ modal.data.description || 'No description' }}
              </div>
            </div>
            <div class="view-field">
              <div class="view-label">Products</div>
              <div class="view-value">{{ modal.data.productCount }}</div>
            </div>
          </template>

          <template v-else-if="modal.type === 'attribute'">
            <div class="view-field">
              <div class="view-label">Attribute Name</div>
              <div class="view-value">{{ modal.data.description }}</div>
            </div>
            <div class="view-field">
              <div class="view-label">Slug</div>
              <div :class="['view-value', { empty: !modal.data.slug }]">
                {{ modal.data.slug || 'No slug' }}
              </div>
            </div>
            <div class="view-field">
              <div class="view-label">Products</div>
              <div class="view-value">{{ modal.data.productCount }}</div>
            </div>
          </template>
        </div>

        <!-- Add/Edit Mode -->
        <form v-else @submit.prevent="submitForm">
          <div class="modal-body">
            <!-- Category Form -->
            <template v-if="modal.type === 'category'">
              <div class="form-group">
                <label>
                  Category Name <span class="required">*</span>
                </label>
                <input
                  v-model="formData.category_name"
                  type="text"
                  placeholder="Enter category name"
                  required
                  maxlength="50"
                />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea
                  v-model="formData.description"
                  placeholder="Enter description (optional)"
                  maxlength="255"
                ></textarea>
                <p class="form-hint">Max 255 characters</p>
              </div>
            </template>

            <!-- Type Form -->
            <template v-else-if="modal.type === 'type'">
              <div class="form-group">
                <label>
                  Category <span class="required">*</span>
                </label>
                <select v-model="formData.category_id" required>
                  <option value="" disabled>Select a category</option>
                  <option
                    v-for="cat in categoryList"
                    :key="cat._id"
                    :value="cat._id"
                  >
                    {{ cat.category_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>
                  Type Name <span class="required">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="Enter type name"
                  required
                  maxlength="255"
                />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea
                  v-model="formData.description"
                  placeholder="Enter description (optional)"
                  maxlength="255"
                ></textarea>
                <p class="form-hint">Max 255 characters</p>
              </div>
            </template>

            <!-- Attribute Form -->
            <template v-else-if="modal.type === 'attribute'">
              <div class="form-group">
                <label>
                  Attribute Name <span class="required">*</span>
                </label>
                <input
                  v-model="formData.description"
                  type="text"
                  placeholder="Enter attribute name"
                  required
                  maxlength="50"
                />
                <p class="form-hint">Slug will be generated automatically</p>
              </div>
            </template>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Saving...' : (modal.mode === 'add' ? 'Create' : 'Update') }}
            </button>
          </div>
        </form>

        <!-- View Mode Footer -->
        <div v-if="modal.mode === 'view'" class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Close</button>
          <button class="btn-submit" @click="openModal(modal.type, 'edit', modal.data)">
            <i class="fas fa-edit"></i> Edit
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
import '@fortawesome/fontawesome-free/css/all.min.css'

const { getToken } = useAuth()
const toast = useToast()

// Tabs
const tabs = [
  { key: 'categories', label: 'Categories' },
  { key: 'types', label: 'Product Types' },
  { key: 'attributes', label: 'Attributes' }
]
const activeTab = ref('categories')

// Categories state
const categories = ref([])
const categoryLoading = ref(false)
const categoryFilters = reactive({ search: '', page: 1, limit: 10 })
const categoryPagination = reactive({
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
  has_next_page: false,
  has_prev_page: false
})

// Types state
const types = ref([])
const typeLoading = ref(false)
const typeFilters = reactive({ search: '', category: '', page: 1, limit: 10 })
const typePagination = reactive({
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
  has_next_page: false,
  has_prev_page: false
})

// Attributes state
const attributes = ref([])
const attributeLoading = ref(false)
const attributeFilters = reactive({ search: '', page: 1, limit: 10 })
const attributePagination = reactive({
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
  has_next_page: false,
  has_prev_page: false
})

// Category list for dropdowns
const categoryList = ref([])

// Modal state
const modal = reactive({
  show: false,
  type: '', // 'category', 'type', 'attribute'
  mode: '', // 'view', 'add', 'edit'
  data: null
})
const formData = reactive({})
const submitting = ref(false)

// Computed
const modalTitle = computed(() => {
  const typeLabels = {
    category: 'Category',
    type: 'Product Type',
    attribute: 'Attribute'
  }
  const modeLabels = {
    view: 'View',
    add: 'Add New',
    edit: 'Edit'
  }
  return `${modeLabels[modal.mode]} ${typeLabels[modal.type]}`
})

// Helpers
function paginationInfo(pagination) {
  const start = (pagination.current_page - 1) * pagination.per_page + 1
  const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_items)
  return `${start} - ${end} of ${pagination.total_items}`
}

function debounce(fn, delay) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

// API calls
async function fetchCategories() {
  categoryLoading.value = true
  try {
    const token = await getToken.value()
    const params = {
      page: categoryFilters.page,
      limit: categoryFilters.limit,
      search: categoryFilters.search
    }
    const res = await axios.get('/api/admin/metadata/categories', {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    if (res.data.success) {
      categories.value = res.data.data
      Object.assign(categoryPagination, res.data.pagination)
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
    toast.error('Failed to load categories')
  } finally {
    categoryLoading.value = false
  }
}

async function fetchTypes() {
  typeLoading.value = true
  try {
    const token = await getToken.value()
    const params = {
      page: typeFilters.page,
      limit: typeFilters.limit,
      search: typeFilters.search,
      category: typeFilters.category
    }
    const res = await axios.get('/api/admin/metadata/types', {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    if (res.data.success) {
      types.value = res.data.data
      Object.assign(typePagination, res.data.pagination)
    }
  } catch (err) {
    console.error('Error fetching types:', err)
    toast.error('Failed to load product types')
  } finally {
    typeLoading.value = false
  }
}

async function fetchAttributes() {
  attributeLoading.value = true
  try {
    const token = await getToken.value()
    const params = {
      page: attributeFilters.page,
      limit: attributeFilters.limit,
      search: attributeFilters.search
    }
    const res = await axios.get('/api/admin/metadata/attributes', {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    if (res.data.success) {
      attributes.value = res.data.data
      Object.assign(attributePagination, res.data.pagination)
    }
  } catch (err) {
    console.error('Error fetching attributes:', err)
    toast.error('Failed to load attributes')
  } finally {
    attributeLoading.value = false
  }
}

async function fetchCategoryList() {
  try {
    const token = await getToken.value()
    const res = await axios.get('/api/admin/metadata/categories/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.success) {
      categoryList.value = res.data.data
    }
  } catch (err) {
    console.error('Error fetching category list:', err)
  }
}

// Debounced search handlers
const debouncedFetchCategories = debounce(() => {
  categoryFilters.page = 1
  fetchCategories()
}, 300)

const debouncedFetchTypes = debounce(() => {
  typeFilters.page = 1
  fetchTypes()
}, 300)

const debouncedFetchAttributes = debounce(() => {
  attributeFilters.page = 1
  fetchAttributes()
}, 300)

// Tab switching
function switchTab(tabKey) {
  activeTab.value = tabKey
  if (tabKey === 'types' && categoryList.value.length === 0) {
    fetchCategoryList()
  }
}

// Modal operations
function openModal(type, mode, data = null) {
  modal.type = type
  modal.mode = mode
  modal.data = data
  modal.show = true

  // Reset form data
  Object.keys(formData).forEach(key => delete formData[key])

  if (mode === 'edit' && data) {
    if (type === 'category') {
      formData.category_name = data.category_name
      formData.description = data.description || ''
    } else if (type === 'type') {
      formData.category_id = data.category?._id || ''
      formData.name = data.name
      formData.description = data.description || ''
    } else if (type === 'attribute') {
      formData.description = data.description
    }
  } else if (mode === 'add') {
    if (type === 'category') {
      formData.category_name = ''
      formData.description = ''
    } else if (type === 'type') {
      formData.category_id = ''
      formData.name = ''
      formData.description = ''
      // Ensure category list is loaded
      if (categoryList.value.length === 0) {
        fetchCategoryList()
      }
    } else if (type === 'attribute') {
      formData.description = ''
    }
  }
}

function closeModal() {
  modal.show = false
  modal.type = ''
  modal.mode = ''
  modal.data = null
}

// Form submission
async function submitForm() {
  submitting.value = true
  try {
    const token = await getToken.value()
    const headers = { Authorization: `Bearer ${token}` }
    let endpoint = ''
    let payload = {}

    if (modal.type === 'category') {
      endpoint = '/api/admin/metadata/categories'
      payload = {
        category_name: formData.category_name,
        description: formData.description
      }
    } else if (modal.type === 'type') {
      endpoint = '/api/admin/metadata/types'
      payload = {
        category_id: formData.category_id,
        name: formData.name,
        description: formData.description
      }
    } else if (modal.type === 'attribute') {
      endpoint = '/api/admin/metadata/attributes'
      payload = {
        description: formData.description
      }
    }

    let res
    if (modal.mode === 'add') {
      res = await axios.post(endpoint, payload, { headers })
    } else {
      res = await axios.put(`${endpoint}/${modal.data._id}`, payload, { headers })
    }

    if (res.data.success) {
      toast.success(res.data.message || 'Operation successful')
      closeModal()
      
      // Refresh the appropriate list
      if (modal.type === 'category') {
        fetchCategories()
        fetchCategoryList() // Refresh dropdown list too
      } else if (modal.type === 'type') {
        fetchTypes()
      } else if (modal.type === 'attribute') {
        fetchAttributes()
      }
    }
  } catch (err) {
    console.error('Error submitting form:', err)
    const message = err.response?.data?.message || 'Operation failed'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

// Delete operation
async function confirmDelete(type, item) {
  const typeLabels = {
    category: 'category',
    type: 'product type',
    attribute: 'attribute'
  }
  
  const nameField = type === 'category' ? item.category_name : 
                    type === 'type' ? item.name : item.description

  if (!confirm(`Are you sure you want to delete the ${typeLabels[type]} "${nameField}"? This action cannot be undone.`)) {
    return
  }

  try {
    const token = await getToken.value()
    const endpoints = {
      category: '/api/admin/metadata/categories',
      type: '/api/admin/metadata/types',
      attribute: '/api/admin/metadata/attributes'
    }

    const res = await axios.delete(`${endpoints[type]}/${item._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data.success) {
      toast.success(res.data.message || 'Deleted successfully')
      
      // Refresh the appropriate list
      if (type === 'category') {
        fetchCategories()
        fetchCategoryList()
      } else if (type === 'type') {
        fetchTypes()
      } else if (type === 'attribute') {
        fetchAttributes()
      }
    }
  } catch (err) {
    console.error('Error deleting:', err)
    const message = err.response?.data?.message || 'Delete failed'
    toast.error(message)
  }
}

// Lifecycle
onMounted(() => {
  fetchCategories()
  fetchCategoryList()
  fetchAttributes()
  fetchTypes()
})
</script>

<style scoped src="./MetadataManagement.css"></style>