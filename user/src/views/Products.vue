<template>
  <div class="container">
    <nav class="breadcrumb">
      <span>Home</span>
      <span class="separator">/</span>
      <span>Products</span>
    </nav>

    <div class="page-banner">
      <img src="@/assets/images/Banner3.png" alt="Products Banner" />
    </div>

    <div class="products-page">
      <aside class="sidebar">
        <button class="filter-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 10H15M2.5 5H17.5M7.5 15H12.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Filter</span>
        </button>

        <div class="filter-section">
          <h3>All Categories</h3>
          <ul class="filter-list">
            <li>
              <label>
                <input type="radio" name="category" v-model="selectedCategory" value="" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">All Categories</span>
              </label>
            </li>
            <li v-for="cat in categories" :key="cat.slug">
              <label>
                <input type="radio" name="category" v-model="selectedCategory" :value="cat.name" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">{{ cat.name }}</span>
              </label>
            </li>
          </ul>
        </div>

        <hr />

        <div class="filter-section">
          <h3>Price</h3>
          <div class="price-slider-container">
            <input 
              type="range" 
              min="0" 
              max="1000000" 
              step="10000"
              v-model="priceMax" 
              @change="applyFilters"
              class="price-slider" 
            />
            <div class="price-values">
              Price: <span>0</span> — <span>{{ formatPrice(priceMax) }}₫</span>
            </div>
          </div>
        </div>

        <hr />

        <div class="filter-section">
          <h3>Popular Tags</h3>
          <div v-if="attributesLoading" class="tags-loading">Loading...</div>
          <div v-else class="tags">
            <span
              v-for="attr in attributes"
              :key="attr.slug"
              class="tag"
              :class="{ active: selectedAttributes.includes(attr.name) }"
              @click="toggleAttribute(attr.name)"
            >
              {{ attr.name }}
            </span>
          </div>
        </div>
      </aside>

      <section class="products-content">
        <div class="products-header">
          <h2>All Products</h2>
          <div class="right-controls">
            <input
              type="text"
              v-model="searchQuery"
              @input="debouncedSearch"
              class="search-bar"
              placeholder="Search products..."
            />
            <select v-model="sortOption" @change="applyFilters" class="sort-select">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <h3>Error Loading Products</h3>
          <p>{{ error }}</p>
          <button @click="fetchProducts" class="retry-btn">Try Again</button>
        </div>

        <!-- Products Grid -->
        <div v-else-if="products.length" class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product._id"
            :product="product"
          />
        </div>

        <!-- No Products Found -->
        <div v-else class="no-products-wrapper">
          <div class="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or filter options.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total_pages > 1" class="pagination">
          <button 
            @click="goToPage(pagination.current_page - 1)" 
            :disabled="!pagination.has_prev_page"
          >
            Prev
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="{ active: pagination.current_page === page }"
          >
            {{ page }}
          </button>
          <button 
            @click="goToPage(pagination.current_page + 1)" 
            :disabled="!pagination.has_next_page"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import ProductCard from '@/components/ProductCard.vue'

// State
const products = ref([])
const categories = ref([])
const attributes = ref([])
const loading = ref(false)
const attributesLoading = ref(false)
const error = ref(null)

// Filters
const selectedCategory = ref('')
const priceMax = ref(1000000)
const selectedAttributes = ref([])
const sortOption = ref('newest')
const searchQuery = ref('')

// Pagination
const pagination = ref({
  current_page: 1,
  per_page: 6,
  total_items: 0,
  total_pages: 0,
  has_next_page: false,
  has_prev_page: false
})

// Debounce timer
let searchTimeout = null

// Computed
const visiblePages = computed(() => {
  const pages = []
  const total = pagination.value.total_pages
  const current = pagination.value.current_page
  
  // Show max 5 pages
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  // Adjust if we're near the beginning or end
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

// Methods
async function fetchProducts(page = 1) {
  try {
    loading.value = true
    error.value = null

    const params = {
      page: page,
      limit: pagination.value.per_page
    }

    const sortMapping = {
      'newest': { sortBy: 'createdAt', sortOrder: 'desc' },
      'price-low': { sortBy: 'price', sortOrder: 'asc' },
      'price-high': { sortBy: 'price', sortOrder: 'desc' },
      'name-asc': { sortBy: 'name', sortOrder: 'asc' },
      'name-desc': { sortBy: 'name', sortOrder: 'desc' }
    }

    const sortConfig = sortMapping[sortOption.value] || {}
    if (sortConfig.sortBy) {
      params.sortBy = sortConfig.sortBy
      params.sortOrder = sortConfig.sortOrder
    }
    
    // Add filters
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    if (priceMax.value < 1000000) {
      params.price_max = priceMax.value
    }
    if (selectedAttributes.value.length > 0) {
      params.attributes = selectedAttributes.value.join(',')
    }
    if (searchQuery.value.trim()) {
      params.q = searchQuery.value.trim()
    }
    const response = await axios.get('api/products/search', { params })

    if (response.data.success) {
      products.value = response.data.data
      console.log(products.value)
      pagination.value = response.data.pagination
    } else {
      error.value = response.data.message || 'Failed to load products'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products. Please try again.'
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const response = await axios.get('api/categories')
    
    if (response.data.success) {
      categories.value = response.data.data.map(cat => ({
        name: cat.category_name,
        slug: cat.category_name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      }))
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
    // Fallback to empty array
    categories.value = []
  }
}

async function fetchAttributes() {
  try {
    attributesLoading.value = true
    const response = await axios.get('api/attributes')
    
    if (response.data.success) {
      attributes.value = response.data.data.map(attr => ({
        name: attr.description,
        slug: attr.description.toLowerCase().replace(/\s+/g, '-')
      }))
    }
  } catch (err) {
    console.error('Error fetching attributes:', err)
    attributes.value = []
  } finally {
    attributesLoading.value = false
  }
}

function toggleAttribute(slug) {
  const index = selectedAttributes.value.indexOf(slug)
  if (index > -1) {
    selectedAttributes.value.splice(index, 1)
  } else {
    selectedAttributes.value.push(slug)
  }
  applyFilters()
}

function applyFilters() {
  fetchProducts(1) // Reset to page 1 when filters change
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500) // Wait 500ms after user stops typing
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.value.total_pages) {
    fetchProducts(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchAttributes()
  ])
})
</script>

<style src="./Products.css"></style>