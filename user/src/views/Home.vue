<template>
  <div class="home-page">
    <!-- Banner chính -->
    <section class="banner-section">
      <img src="@/assets/images/Banner4.png" alt="Banner" class="banner-img" />
      <button class="banner-btn">Shop Now</button>
    </section>

    <!-- Các icon mô tả dịch vụ -->
    <section class="banner-icons-section">
      <div class="icon-item">
        <i class="fa-solid fa-truck"></i>
        <h4>Free Shipping</h4>
        <p>Free shipping on all your orders</p>
      </div>
      <div class="icon-item">
        <i class="fa-solid fa-headset"></i>
        <h4>Customer Support 24/7</h4>
        <p>Instant access to support</p>
      </div>
      <div class="icon-item">
        <i class="fa-solid fa-shield-halved"></i>
        <h4>100% Secure Payment</h4>
        <p>We ensure your money is safe</p>
      </div>
      <div class="icon-item">
        <i class="fa-solid fa-rotate-left"></i>
        <h4>Money-Back Guarantee</h4>
        <p>30 days money-back guarantee</p>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="featured-products">
      <h2>Featured Products</h2>
      <div class="products-grid">
        <ProductCard
          v-for="(product, index) in featuredProducts"
          :key="index"
          :img="product.image"
          :name="product.name"
          :oldPrice="product.oldPrice"
          :price="product.price"
          :discount="product.discount"
        />
      </div>
    </section>

    <!-- Special Offers -->
    <!-- Special Offers -->
<section class="special-offers">
  <h2>Special Offers</h2>
  <div class="offers-container">
    <div
      class="offer-banner"
      v-for="(offer, index) in offers"
      :key="index"
    >
      <img :src="offer.image" :alt="`Special Offer ${index + 1}`" />
      <button class="offer-btn">Shop Now</button>
    </div>
  </div>
</section>

    <!-- Customer Reviews -->
    <section class="customer-reviews">
      <h2>What our customers say</h2>
      <div class="reviews-grid">
        <div
          class="review-card"
          v-for="(review, index) in reviews"
          :key="index"
        >
          <p class="review-text">"{{ review.text }}"</p>
          <div class="review-footer">
            <img src="@/assets/images/avatar.png" alt="Avatar" class="avatar" />
            <div class="review-info">
              <h4>{{ review.name }}</h4>
              <div class="review-rating">
                <i
                  v-for="n in 5"
                  :key="n"
                  :class="[
                    n <= review.rating ? 'fas fa-star' : 'far fa-star',
                  ]"
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import ProductCard from '@/components/ProductCard.vue'

const featuredProducts = [
  {
    name: 'Corn',
    image: new URL('@/assets/images/Corn.png', import.meta.url).href,
    oldPrice: 29.99,
    price: 19.99,
    discount: 10
  },
  {
    name: 'Apple',
    image: new URL('@/assets/images/apple.png', import.meta.url).href,
    oldPrice: 39.99,
    price: 29.99,
    discount: 10,
  },
  {
    name: 'Chinese Cabbage',
    image: new URL('@/assets/images/ChaniseCabbage.png', import.meta.url).href,
    oldPrice: 49.99,
    price: 39.99,
    discount: 10,
  },
  {
    name: 'Green Chili',
    image: new URL('@/assets/images/GreenChili.png', import.meta.url).href,
    oldPrice: 59.99,
    price: 49.99,
    discount: 10,
  },
  {
    name: 'Green Lettuce',
    image: new URL('@/assets/images/GreenLettuce.png', import.meta.url).href,
    oldPrice: 69.99,
    price: 59.99,
    discount: 10,
  },
]

const offers = [
  { image: new URL('@/assets/images/Offer1.png', import.meta.url).href },
  { image: new URL('@/assets/images/Offer2.png', import.meta.url).href },
  { image: new URL('@/assets/images/Offer3.png', import.meta.url).href },
]

const reviews = [
  {
    name: 'Jane Doe',
    text: 'Great products! Healthy and tasty. Highly recommended.',
    rating: 5,
  },
  {
    name: 'John Smith',
    text: 'Excellent service and fast delivery. Loved the taste.',
    rating: 4,
  },
  {
    name: 'Mary Johnson',
    text: 'Loved the packaging and freshness. Will order again!',
    rating: 4,
  },
]
</script>

<style src="./Home.css"></style>