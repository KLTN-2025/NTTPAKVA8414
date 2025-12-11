<template>
  <div class="product-page">
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="Products Banner" class="cart-banner-img" />
    
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>Products</strong> </nav>
    </div>
  </div>

  <div class="container">
    <div class="products-page">
      <aside class="sidebar">
        <h2 class="filter-header">Filters</h2>
        <div class="filter-section">
          <h3>Categories</h3>
          <ul class="filter-list">
            <li>
              <label>
                <input type="radio" name="category" v-model="selectedCategory" value="" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">All</span>
              </label>
            </li>
            <li v-for="cat in categories" :key="cat._id">
              <label>
                <input type="radio" name="category" v-model="selectedCategory" :value="cat._id" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">{{ cat.category_name }}</span>
              </label>
            </li>
          </ul>
        </div>

        <div class="filter-section">
          <h3 style="margin-bottom: 0;">Price</h3>
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

        <div class="filter-section">
          <h3>Rating</h3>
          <ul class="filter-list">
            <li>
              <label>
                <input type="radio" name="rating" v-model.number="selectedMinRating" value="0" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">All</span>
              </label>
            </li>
            <li v-for="minRating in 4" :key="minRating">
              <label>
                <input type="radio" name="rating" v-model.number="selectedMinRating" :value="minRating" @change="applyFilters" />
                <span class="custom-radio"></span>
                <span class="label-text">{{ minRating }}.0 or better</span>
              </label>
            </li>
          </ul>
        </div>

        <div class="filter-section">
          <h3>Popular Tags</h3>
          <div v-if="attributesLoading" class="tags-loading">Loading...</div>
          <div v-else class="tags">
            <span
              v-for="attr in attributes"
              :key="attr._id"
              
              class="tag"
              :class="{ active: selectedAttributes.includes(attr._id) }"
              @click="toggleAttribute(attr._id)"
            >
              {{ attr.description }}
            </span>
          </div>
        </div>
      </aside>

      <section class="products-content">
        <div class="products-header">
          <h2 style="font-size: 2rem; margin-left: 1rem;">All Products</h2>
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
              <option value="rating-high">Rating: High → Low</option>
              <option value="rating-low">Rating: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="price-low">Price: Low → High</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <h3>Error Loading Products</h3>
          <p>{{ error }}</p>
          <button @click="fetchProducts" class="retry-btn">Try Again</button>
        </div>

        <div v-else-if="products.length" class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product._id"
            :product="product"
          />
        </div>

        <div v-else class="no-products-wrapper">
          <div class="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or filter options.</p>
          </div>
        </div>

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
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import axios from 'axios'
import ProductCard from '@/components/ProductCard.vue'

// Thêm import cho icon
import '@fortawesome/fontawesome-free/css/all.min.css';

// State
const products = ref([])
const categories = ref([])
const attributes = ref([])
const loading = ref(false)
const attributesLoading = ref(false)
const error = ref(null)

// Filters
const selectedCategory = ref('')
const selectedMinRating = ref(0)
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
      'rating-low': { sortBy: 'rating', sortOrder: 'asc' },
      'rating-high': { sortBy: 'rating', sortOrder: 'desc' },
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
    if (selectedMinRating.value) {
      params.min_rating = selectedMinRating.value
    }
    const response = await axios.get('/api/products/search', {
      params: params })

    if (response.data.success) {
      products.value = response.data.data
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
    const response = await axios.get('/api/categories')
    
    if (response.data.success) {
      categories.value = response.data.data
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
    const response = await axios.get('/api/attributes')
    
    if (response.data.success) {
      attributes.value = response.data.data
    }
  } catch (err) {
    console.error('Error fetching attributes:', err)
    attributes.value = []
  } finally {
    attributesLoading.value = false
  }
}

function toggleAttribute(id) {
  const index = selectedAttributes.value.indexOf(id)
  if (index > -1) {
    selectedAttributes.value.splice(index, 1)
  } else {
    selectedAttributes.value.push(id)
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

<style scoped src="../styling/Products.css"></style>