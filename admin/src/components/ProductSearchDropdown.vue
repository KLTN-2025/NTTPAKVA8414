<template>
  <div class="product-search-container" ref="containerRef">
    <div class="search-input-wrapper">
      <i class="fas fa-search search-icon"></i>
      <input
        type="text"
        v-model="searchQuery"
        @input="handleInput"
        @focus="showDropdown = true"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
        :placeholder="placeholder"
        class="search-input"
      />
      <i 
        v-if="searchQuery" 
        class="fas fa-times clear-icon" 
        @click="clearSearch"
      ></i>
    </div>

    <div v-if="showDropdown && (loading || products.length > 0 || searchQuery.length >= 1)" class="dropdown">
      <div v-if="loading" class="dropdown-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Searching...</span>
      </div>

      <div v-else-if="products.length === 0 && searchQuery.length >= 1" class="dropdown-empty">
        <i class="fas fa-box-open"></i>
        <span>No products found</span>
      </div>

      <ul v-else class="dropdown-list">
        <li
          v-for="(product, index) in products"
          :key="product._id"
          :class="['dropdown-item', { 'highlighted': index === highlightedIndex }]"
          @click="selectProduct(product)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="product-info">
            <span class="product-sku">{{ product.SKU }}</span>
            <span class="product-name">{{ product.name }}</span>
          </div>
          <div class="product-meta">
            <span class="product-cost">Cost: {{ formatPrice(product.cost_price) }}</span>
            <span class="product-stock">Stock: {{ product.current_stock }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { formatPrice } from '@/utilities/helper'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search product by SKU or name...'
  },
  excludeIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const containerRef = ref(null)
const searchQuery = ref('')
const products = ref([])
const loading = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)

let debounceTimer = null

function handleInput() {
  clearTimeout(debounceTimer)
  
  if (searchQuery.value.length < 1) {
    products.value = []
    return
  }

  debounceTimer = setTimeout(() => {
    searchProducts()
  }, 1000)
}

async function searchProducts() {
  if (searchQuery.value.length < 1) return

  loading.value = true
  try {
    const response = await axios.get('/api/admin/products/search', {
      params: {
        q: searchQuery.value,
        limit: 10
      }
    })

    if (response.data?.success) {
      // Filter out already added products
      products.value = response.data.data.filter(
        p => !props.excludeIds.includes(p._id)
      )
    }
  } catch (err) {
    console.error('Product search error:', err)
    products.value = []
  } finally {
    loading.value = false
  }
}

function selectProduct(product) {
  emit('select', product)
  clearSearch()
}

function clearSearch() {
  searchQuery.value = ''
  products.value = []
  showDropdown.value = false
  highlightedIndex.value = -1
}

function closeDropdown() {
  showDropdown.value = false
  highlightedIndex.value = -1
}

function navigateDown() {
  if (products.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % products.value.length
}

function navigateUp() {
  if (products.value.length === 0) return
  highlightedIndex.value = highlightedIndex.value <= 0 
    ? products.value.length - 1 
    : highlightedIndex.value - 1
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < products.value.length) {
    selectProduct(products.value[highlightedIndex.value])
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(debounceTimer)
})
</script>

<style scoped>
.product-search-container {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-light, #9ca3af);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: var(--admin-bg, #f9fafb);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 0 0 3px var(--primary-color-light, rgba(79, 70, 229, 0.1));
}

.search-input::placeholder {
  color: var(--text-light, #9ca3af);
}

.clear-icon {
  position: absolute;
  right: 1rem;
  color: var(--text-light, #9ca3af);
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-icon:hover {
  color: var(--text-dark, #111827);
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--sidebar-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-loading,
.dropdown-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: var(--text-light, #9ca3af);
  font-size: 0.9rem;
}

.dropdown-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background-color: var(--admin-bg, #f9fafb);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-sku {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color, #4F46E5);
  text-transform: uppercase;
}

.product-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-dark, #111827);
}

.product-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.product-cost {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-dark, #111827);
}

.product-stock {
  font-size: 0.75rem;
  color: var(--text-light, #9ca3af);
}
</style>