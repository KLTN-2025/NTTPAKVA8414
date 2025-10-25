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
                <input type="radio" name="category" v-model="selectedCategory" value="" />
                <span class="custom-radio"></span>
                <span class="label-text">All Categories</span>
              </label>
            </li>
            <li v-for="cat in categories" :key="cat">
              <label>
                <input type="radio" name="category" v-model="selectedCategory" :value="cat" />
                <span class="custom-radio"></span>
                <span class="label-text">{{ cat }}</span>
              </label>
            </li>
          </ul>
        </div>

        <hr />

        <div class="filter-section">
          <h3>Price</h3>
          <div class="price-slider-container">
            <input type="range" min="0" max="100" v-model="priceRange" class="price-slider" />
            <div class="price-values">
              Price: <span>$0</span> — <span>${{ priceRange }}</span>
            </div>
          </div>
        </div>

        <hr />

        <div class="filter-section">
          <h3>Rating</h3>
          <ul class="filter-list rating-list">
            <li v-for="rating in ratings" :key="rating.value">
              <label>
                <input type="checkbox" v-model="selectedRatings" :value="rating.value" />
                <span class="custom-checkbox"></span>
                <span class="stars">
                  {{ getStars(rating.stars).solid }}<span class="star-empty">{{ getStars(rating.stars).empty }}</span>
                </span>
                <span>{{ rating.text }}</span>
              </label>
            </li>
          </ul>
        </div>

        <hr />

        <div class="filter-section">
          <h3>Popular Tags</h3>
          <div class="tags">
            <span
              v-for="(tag, index) in tags"
              :key="index"
              class="tag"
              :class="{ active: selectedTag === tag }"
              @click="selectedTag = selectedTag === tag ? '' : tag"
            >
              {{ tag }}
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
              class="search-bar"
              placeholder="Search products..."
            />
            <select v-model="sortOption" class="sort-select">
              <option value="default">Sort by Default</option>
              <option value="price-low-high">Price: Low → High</option>
              <option value="price-high-low">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div v-if="paginatedProducts.length" class="products-grid">
          <ProductCard
            v-for="(product, index) in paginatedProducts"
            :key="index"
            :img="product.image"
            :name="product.name"
            :oldPrice="product.oldPrice"
            :price="product.price"
            :discount="product.discount"
          />
        </div>

       <div v-else class="no-products-wrapper">
  <div class="no-products">
    <h3>No products found</h3>
    <p>Try adjusting your search or filter options.</p>
  </div>
</div>

        <div v-if="totalPages > 1" class="pagination">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
            Prev
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            :class="{ active: currentPage === page }"
          >
            {{ page }}
          </button>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
            Next
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
// Bỏ import font-awesome, vì chúng ta dùng text stars
// import '@fortawesome/fontawesome-free/css/all.min.css' 

// --- DỮ LIỆU GỐC CỦA BẠN ---
const categories = ['Vegetables', 'Fruits', 'Nuts', 'Beverages']
const tags = ['Organic', 'Fresh', 'Vegan', 'Low-fat', 'Natural']
const products = ref([
  {
    name: 'Corn',
    image: new URL('@/assets/images/Corn.png', import.meta.url).href,
    oldPrice: 29.99,
    price: 19.99,
    discount: 10,
    category: 'Vegetables',
    rating: 4,
    tags: ['Organic']
  },
  {
    name: 'Apple',
    image: new URL('@/assets/images/apple.png', import.meta.url).href,
    oldPrice: 39.99,
    price: 29.99,
    discount: 10,
    category: 'Fruits',
    rating: 5,
    tags: ['Fresh']
  },
  {
    name: 'Cabbage',
    image: new URL('@/assets/images/ChaniseCabbage.png', import.meta.url).href,
    oldPrice: 49.99,
    price: 39.99,
    discount: 20,
    category: 'Vegetables',
    rating: 3,
    tags: ['Vegan']
  },
  {
    name: 'Green Chili',
    image: new URL('@/assets/images/GreenChili.png', import.meta.url).href,
    oldPrice: 59.99,
    price: 49.99,
    discount: 10,
    category: 'Vegetables',
    rating: 4,
    tags: ['Low-fat']
  },
  {
    name: 'Green Lettuce',
    image: new URL('@/assets/images/GreenLettuce.png', import.meta.url).href,
    oldPrice: 69.99,
    price: 59.99,
    discount: 10,
    category: 'Vegetables',
    rating: 5,
    tags: ['Organic']
  },
  {
    name: 'Cauliflower',
    image: new URL('@/assets/images/Cauliflower.png', import.meta.url).href,
    oldPrice: 45.99,
    price: 34.99,
    discount: 15,
    category: 'Vegetables',
    rating: 4,
    tags: ['Fresh']
  }
])

// --- DỮ LIỆU MỚI & CẬP NHẬT ---

// Dữ liệu cho Rating, khớp với hình ảnh
const ratings = ref([
  { value: 5, text: '5.0', stars: 5 },
  { value: 4, text: '4.0 & up', stars: 4 },
  { value: 3, text: '3.0 & up', stars: 3 },
  { value: 2, text: '2.0 & up', stars: 2 },
  { value: 1, text: '1.0 & up', stars: 1 },
])

// Hàm helper để tạo sao
function getStars(n) {
  return {
    solid: '★'.repeat(n),
    empty: '★'.repeat(5 - n)
  }
}

// Thay đổi state cho filters
const selectedCategory = ref('') // Đổi từ mảng sang chuỗi cho radio button
const priceRange = ref(100) // Tăng max price default để thấy sản phẩm
const selectedRatings = ref([]) // Giữ nguyên là mảng cho checkbox
const selectedTag = ref('')
const sortOption = ref('default')
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = 6

// --- LOGIC TÍNH TOÁN (CẬP NHẬT) ---

const sortedProducts = computed(() => {
  let sorted = [...products.value]
  if (sortOption.value === 'price-low-high') {
    sorted.sort((a, b) => a.price - b.price)
  } else if (sortOption.value === 'price-high-low') {
    sorted.sort((a, b) => b.price - a.price)
  }
  return sorted
})

// CẬP NHẬT LOGIC FILTER
const filteredProducts = computed(() => {
  // Reset về trang 1 mỗi khi filter thay đổi
  currentPage.value = 1

  return sortedProducts.value.filter((p) => {
    // Logic Category MỚI (khớp chuỗi, "" là 'All')
    const matchCategory = !selectedCategory.value || p.category === selectedCategory.value

    // Logic Rating MỚI (X & up = p.rating >= X)
    // Tìm rating tối thiểu được chọn. Vd: nếu [4, 2] được chọn, min là 2 -> lọc p.rating >= 2
    const minRating = selectedRatings.value.length ? Math.min(...selectedRatings.value) : 0
    const matchRating = minRating === 0 || p.rating >= minRating

    // Logic cũ
    const matchTag = !selectedTag.value || p.tags.includes(selectedTag.value)
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchPrice = p.price <= priceRange.value
    
    return matchCategory && matchRating && matchTag && matchSearch && matchPrice
  })
})

// Pagination (Không đổi)
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProducts.value.slice(start, end)
})

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style src="./Products.css"></style>