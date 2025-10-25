<template>
  <div class="product-card">
    <!-- Sale Tag -->
    <div v-if="discount" class="sale-tag">-{{ discount }}%</div>

    <!-- Favorite Icon -->
    <div class="favorite-icon" @click="toggleFavorite">
      <i :class="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
    </div>

    <!-- Product Image -->
    <img :src="img" :alt="name" />

    <!-- Product Info -->
    <div class="product-info">
      <div class="name-price">
        <h3>{{ name }}</h3>
        <p class="price">
          <span v-if="oldPrice" class="old-price">${{ oldPrice.toFixed(2) }}</span>
          ${{ price.toFixed(2) }}
        </p>
      </div>

      <div class="add-cart-wrapper" @click="addToCart">
        <i class="fa-solid fa-cart-plus"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import '@fortawesome/fontawesome-free/css/all.min.css'
import './ProductCard.css'
import { ref } from 'vue'

// Props để component linh hoạt tái sử dụng
defineProps({
  name: String,
  img: String,
  price: Number,
  oldPrice: Number,
  discount: Number,
})

// Favorite state
const isFavorite = ref(false)

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

// Xử lý thêm giỏ hàng
const addToCart = () => {
  alert(`Added "${name}" to cart!`)
}
</script>